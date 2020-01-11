---
title: "Building AUR Packages"
path: "/2020/Jan/joplin-pkgbuild"
tags: ["Programming", "Today I Learned"]
date: 2020-01-10
---

# Background

So two pieces of background:
1. The [Today I Learned](/tag/Today-I-Learned/) tag will be what I use for things I literally just learned. Likely, it'll be things I learned in the last couple weeks rather than the last couple days, but TIL sounds much better. As such, I may very well be wrong or at least very incomplete. Since it's something I'm just learning I would *extra* appreciate any new insights on the matter (respectfully given of course).
2. I run a lot of different operating systems (more on that another time). On my laptop, I run [Manjaro](manjaro.org/) an Arch-based distro with some (mostly) reasonable defaults. The reason I run it is that my current window manager of choice is [i3](https://i3wm.org/) and the community i3 spin comes with most of the config I want without having to write it myself.

# What I learned

While hanging out on the Joplin forum, I saw that another Arch user was having [issues getting the thing to install via AUR](https://discourse.joplinapp.org/t/joplin-will-not-start-on-linux-after-building-from-source/5009). Having recently had similar problems getting the thing to build in Docker, I decided to help out.

The intention was not to actually submit a PR to submit the `PKGBUILD`, but I did anyway and it got merged! Unfortunately, there's still issues with it for some users due to an invalid (or at least weird) `.SRCINFO` file.

If you (like me) had no idea what the heck this file was for here's what the [Arch Wiki](https://wiki.archlinux.org/index.php/.SRCINFO) has to say about it:
> `.SRCINFO` files contain package metadata in a simple, unambiguous format, so that tools such as the AUR's Web back-end or AUR helpers may retrieve a package's metadata without parsing the PKGBUILD directly.

It works for me, though so I went to find out why and it turns out that `pamac` (the AUR helper on Manjaro) will frequently regenerate a valid `PKGBUILD` and is quite forgiving, but some AUR helpers (yay in particular) are not quite as accepting.

The code from [pamac](https://gitlab.manjaro.org/applications/pamac/blob/master/src/database.vala#L1441) (reproduced below) that will regenerate a `.SRCINFO` file if it's out of date. There's likely code elsewhere that is also just deals with multiple `pkgbase` sections rather than failing, though I didn't look hard enough to find the exact section.

`pamac` code:
```vala
bool regenerate_srcinfo_real (string pkgname, Cancellable? cancellable) {
    string pkgdir_name;
    if (config.aur_build_dir == "/var/tmp") { 
            pkgdir_name = Path.build_path ("/", config.aur_build_dir, "pamac-build-%s".printf (Environment.get_user_name ()), pkgname);
    } else { 
            pkgdir_name = Path.build_path ("/", config.aur_build_dir, "pamac-build", pkgname);
    } 
    var srcinfo = File.new_for_path (Path.build_path ("/", pkgdir_name, ".SRCINFO"));
    var pkgbuild = File.new_for_path (Path.build_path ("/", pkgdir_name, "PKGBUILD"));
    if (srcinfo.query_exists ()) { 
            // check if PKGBUILD was modified after .SRCINFO 
            try { 	
            FileInfo info = srcinfo.query_info ("time::modified", 0);
            DateTime srcinfo_time = info.get_modification_date_time ();
            info = pkgbuild.query_info ("time::modified", 0);
            DateTime pkgbuild_time = info.get_modification_date_time ();
            if (srcinfo_time.compare (pkgbuild_time) == 1) {
                    // no need to regenerate 
                    return true;
            } 
        } catch (Error e) { 
            critical ("%s\n", e.message);
        } 
}
// ..
```


This is the much less lenient line of code from the [package](https://github.com/Morganamilo/go-srcinfo/blob/master/parser.go#L33) `yay` uses to parse `.SRCINFO` files:

```go
case "pkgbase":
    if psr.srcinfo.Pkgbase != "" {
        return fmt.Errorf("key \"%s\" can not occur after pkgbase or pkgname", key)
    }

    pkgbase.Pkgbase = value
    return nil
```

Looking at the Arch Wiki (because I've got no idea where this is better documented), it seems to be implied that you can only have one `pkgbase` line per file (emphasis mine):
> The following fields may appear only once in each .SRCINFO file, in **the** pkgbase section: 

## Solution?
Open another [PR](https://github.com/alfredopalhares/joplin-pkgbuild/pull/42) which will hopefully get merged and help these guys out.