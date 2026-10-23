#!/usr/bin/env python3
"""Poll owner-created [Codex] issues and execute using the logged-in WSL Codex CLI."""
import fcntl
import json
import re
import shutil
import subprocess
import time
from pathlib import Path

REPO = 'tranngochuyc-cyber/web-bien-s2'
OWNER = 'tranngochuyc-cyber'
HOME = Path.home() / '.local/share/web-bien-s2-codex'
WORK = HOME / 'repo'
STATE = HOME / 'state.json'

def run(*args, cwd=None, prompt=None, log=None, check=True):
    if log:
        with open(log, 'a', encoding='utf-8') as f:
            f.write('\n' + ' '.join(args) + '\n')
            result = subprocess.run(args, cwd=cwd, input=prompt, text=True, stdout=f, stderr=subprocess.STDOUT)
        return result.returncode
    result = subprocess.run(args, cwd=cwd, input=prompt, text=True, capture_output=True)
    if check and result.returncode:
        raise RuntimeError((result.stderr or result.stdout)[-1500:])
    return result.stdout.strip()

def git(*args):
    return run('git', *args, cwd=WORK)

def persist(state):
    tmp = STATE.with_suffix('.tmp')
    tmp.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding='utf-8')
    tmp.replace(STATE)

def stamp(text):
    print(time.strftime('[%Y-%m-%d %H:%M:%S] ') + text, flush=True)

def tasks():
    result = run('gh', 'issue', 'list', '-R', REPO, '-s', 'open', '-L', '100',
                 '--json', 'number,title,body,author')
    return sorted((i for i in json.loads(result) if i['title'].startswith('[Codex]')
                   and i.get('author', {}).get('login') == OWNER), key=lambda i: i['number'])

def handle(issue, state):
    n = issue['number']
    item = state.setdefault(str(n), {})
    if item.get('phase') == 'complete' or time.time() < item.get('retry_at', 0):
        return
    log = HOME / f'issue-{n}.log'
    try:
        if not item.get('branch'):
            if git('status', '--porcelain'):
                raise RuntimeError('Dedicated clone has local changes; refusing to overwrite')
            git('fetch', 'origin', 'main')
            branch = f'codex/issue-{n}-wsl'
            if run('git', 'ls-remote', '--heads', 'origin', branch, cwd=WORK):
                raise RuntimeError(f'Remote branch {branch} already exists')
            git('switch', '-c', branch, 'origin/main')
            item.update(branch=branch, phase='coding')
            persist(state)
        elif git('branch', '--show-current') != item['branch']:
            if git('status', '--porcelain'):
                raise RuntimeError('Uncommitted work on another branch; not switching')
            git('switch', item['branch'])

        if item['phase'] == 'coding':
            prompt = (
                'Act as Codex developer for WEB_BIEN_S2. Preserve all current site work, '
                'existing assets, UI/UX, accessibility and functionality. '
                'Work only inside this checkout; do not delete unrelated files or change CI, '
                'permissions, tokens or repository settings. Do not commit or push; the worker handles that. '
                'Implement, run tests, inspect failures and make real changes. '
                'If properly configured, Antigravity CLI may be delegated work; otherwise work directly. '
                'On retries, continue from existing changes rather than starting over.\n\n'
                f'ISSUE #{n}: {issue["title"]}\n{issue.get("body") or ""}\n'
                f'Previous error: {item.get("error", "")[-1700:]}'
            )
            stamp(f'Codex executing issue #{n}')
            code = run('codex', 'exec', '--full-auto', '-', cwd=WORK, prompt=prompt, log=log)
            if code:
                tail = log.read_text(encoding='utf-8', errors='replace')[-2400:]
                if re.search(r'quota|429|rate.?limit|usage.?limit|too many requests', tail, re.I):
                    raise RuntimeError('QUOTA: ' + tail)
                raise RuntimeError(tail)
            item['phase'] = 'verifying'
            persist(state)

        if item['phase'] == 'verifying':
            for cmd in [('npm', 'ci'), ('npm', 'run', 'build'), ('npm', 'test', '--if-present')]:
                if run(*cmd, cwd=WORK, log=log):
                    item['phase'] = 'coding'
                    raise RuntimeError('Build/test failed; retry from checkpoint: ' +
                                       log.read_text(encoding='utf-8', errors='replace')[-1700:])
            item['phase'] = 'publishing'
            persist(state)

        if item['phase'] == 'publishing':
            if not item.get('committed'):
                git('add', '-A')
                files = git('diff', '--cached', '--name-only').splitlines()
                if any(x.startswith('.github/workflows/') or x == 'scripts/codex_issue_worker.py' for x in files):
                    raise RuntimeError('Automated edits to workflow/worker are blocked')
                if not files:
                    item.update(phase='complete', result='No code changes')
                    persist(state)
                    return
                git('config', 'user.name', 'Codex Worker')
                git('config', 'user.email', 'codex-worker@users.noreply.github.com')
                git('commit', '-m', f'Codex: implement issue #{n}')
                item['committed'] = True
                persist(state)
            run('gh', 'auth', 'setup-git')
            git('push', '-u', 'origin', item['branch'])
            prs = json.loads(run('gh', 'pr', 'list', '-R', REPO, '--head', item['branch'], '--json', 'url'))
            url = prs[0]['url'] if prs else run('gh', 'pr', 'create', '-R', REPO,
                    '--base', 'main', '--head', item['branch'],
                    '--title', f'Codex: implement issue #{n}',
                    '--body', f'Automatic implementation of issue #{n}; local build completed.', cwd=WORK)
            item.update(phase='complete', result=url, retry_at=0)
            persist(state)
            stamp(f'Issue #{n} finished: {url}')
            try:
                run('gh', 'issue', 'comment', str(n), '-R', REPO, '--body', f'WSL Codex has completed: {url}')
            except Exception as e:
                stamp(f'Could not comment: {e}')
    except Exception as error:
        msg = str(error)
        item.update(error=msg, retry_at=time.time() + (900 if msg.startswith('QUOTA:') else 180))
        persist(state)
        stamp(f'Issue #{n} checkpoint kept; retry scheduled. {msg[-250:]}')

def main():
    for name in ('git', 'gh', 'codex', 'npm'):
        if not shutil.which(name):
            raise SystemExit(f'Missing {name} in WSL PATH')
    HOME.mkdir(parents=True, exist_ok=True)
    with open(HOME / 'worker.lock', 'w') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise SystemExit('Worker already running')
        stamp('Watching owner-authored [Codex] GitHub issues; using isolated clone')
        while True:
            try:
                if not (WORK / '.git').exists():
                    run('gh', 'repo', 'clone', REPO, str(WORK))
                state = json.loads(STATE.read_text()) if STATE.exists() else {}
                for issue in tasks():
                    handle(issue, state)
            except Exception as e:
                stamp(f'Queue unavailable, retrying: {e}')
            time.sleep(60)

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        stamp('Worker stopped')
