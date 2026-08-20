BookNook ambient sounds
========================

The app synthesizes ambient sound procedurally, so it works with no files.
But you can upgrade any ambience to a REAL recording just by dropping a looping
audio file here with the matching name:

    public/sounds/rain.mp3
    public/sounds/ocean.mp3
    public/sounds/fire.mp3
    public/sounds/cafe.mp3
    public/sounds/forest.mp3

As soon as a file exists, the player uses it automatically (and falls back to the
synthesized version if the file is missing or fails to load).

Tips
----
- Use seamless LOOPING clips (30s–3min is plenty) so there's no gap on repeat.
- Keep them reasonably small (aim < ~2 MB each) so the site stays fast.
- .mp3 is the safest format for browsers; .ogg also works if you rename the path.

Where to find royalty-free (CC0 / public-domain) loops
------------------------------------------------------
- Pixabay Sound Effects (pixabay.com/sound-effects) — CC0, no attribution needed
- freesound.org — filter by "Creative Commons 0" license
- mixkit.co/free-sound-effects — free for commercial use

Download an "ambient rain loop", "ocean waves loop", "fireplace crackle loop",
"coffee shop ambience loop", "forest birds loop", rename to the names above, and
drop them in this folder. Commit + redeploy and the real sounds go live.
