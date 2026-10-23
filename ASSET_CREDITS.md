# Manta ray 3D asset

The file `public/models/manta-ray.glb` is **Manta Ray Birostris (animated)** by **Violaine**, originally published at https://sketchfab.com/3d-models/manta-ray-birostris-animated-c49e5bb3cb32477cbbf96f36a47c9f2b . The version used here was converted to metallic-roughness glTF by the Open Water project: https://github.com/bob6664569/open-water .

License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0): https://creativecommons.org/licenses/by-nc-sa/4.0/ . The model may be used only under those terms. The source code of WEB_BIEN_S2 is separate from the model license. Do not reuse the model for commercial purposes without obtaining a different license from the creator.

The file is approximately 2 MB and includes a skinned mesh, three embedded images, one material and one swimming animation. The website plays that animation with Three.js AnimationMixer.

## Sunlit reef scans

The following coral scans are by **The Smithsonian Institution** and are released under **CC0 1.0**:

- [Stylaster sanguineus](https://sketchfab.com/3d-models/stylaster-sanguineus-4f1ddd8352944d16bf3b821b3e71b473) — `public/models/coral/stylaster_coral.glb`
- [Seriatopora hystrix](https://sketchfab.com/3d-models/seriatopora-hystrix-b6be88ce19e14e5bb038918d111430d5) — `public/models/coral/seriatopora_coral.glb`
- [Goniastrea favulus](https://sketchfab.com/3d-models/goniastrea-favulus-526ede8a83f943ee868d6991a6d5a533) — `public/models/coral/goniastrea_coral.glb`

The GLBs used here are optimized derivatives published in [web-ocean-3d](https://github.com/2600th/web-ocean-3d/blob/main/ASSET_LICENSES.md): meshes were decimated and Meshopt-compressed; textures were resized and KTX2-encoded. They are placed at different scales and rotations in the scene. Their total download size is about 1.28 MB. CC0 permits use, modification and redistribution without attribution; these credits document the provenance.

The KTX2 texture transcoder in `public/basis/` is **Basis Universal**, licensed under Apache 2.0. Its license text is included at `public/basis/LICENSE.txt`. Three.js loaders and the Meshopt decoder come from the project's installed Three.js package.
