NO INTERNET / OFFLINE ILLUSTRATION - APP ASSET PACK
====================================================

All PNGs are 32-bit RGBA with a fully transparent background, square,
so they sit correctly on light AND dark themes. The original baked-in
grey floor shadow has been removed (add your own if you want one).

FOLDER GUIDE
------------

android/res/drawable-*/ic_no_internet.png
    mdpi     200 x 200   (1x  - baseline)
    hdpi     300 x 300   (1.5x)
    xhdpi    400 x 400   (2x)
    xxhdpi   600 x 600   (3x)
    xxxhdpi  800 x 800   (4x)
    -> Copy the drawable-* folders into app/src/main/res/
    -> Designed for a 200dp illustration slot. Use:
       <ImageView
           android:layout_width="200dp"
           android:layout_height="200dp"
           android:src="@drawable/ic_no_internet"
           android:contentDescription="No internet connection" />

ios/no_internet.imageset/
    @1x 200, @2x 400, @3x 600 + Contents.json
    -> Drag the whole .imageset folder into Assets.xcassets
    -> UIImage(named: "no_internet")  /  Image("no_internet")

flutter/assets/images/
    no_internet.png (200), 2.0x/ (400), 3.0x/ (600)
    -> pubspec.yaml:
         flutter:
           assets:
             - assets/images/no_internet.png
       (Flutter picks 2.0x / 3.0x automatically - don't list them)
    -> Image.asset('assets/images/no_internet.png', width: 200)

react-native/
    no_internet.png, @2x, @3x  (Metro resolves the suffixes for you)
    -> <Image source={require('./no_internet.png')} style={{width:200,height:200}} />

web/
    no-internet-256 / 512 / 1024 .png  + a 512 .webp (smaller, use with
    <picture> and a PNG fallback)

master/
    no_internet_master_transparent.png  - full resolution, transparent
    no_internet_master_white_bg.png     - full resolution, flat white
    Keep these as the source if you ever need to re-export.

WHICH SIZES DO YOU ACTUALLY NEED?
---------------------------------
Android  -> all five drawable-* folders (or just xhdpi/xxhdpi/xxxhdpi if
            you want to save APK size; those cover ~95% of live devices)
iOS      -> the imageset (@1x @2x @3x)
Flutter  -> 1x + 2.0x + 3.0x
Web      -> 512 png (+ webp)

If your empty-state box is bigger than 200dp, re-export from the master
at 1.5x/2x/3x/4x of whatever dp size you settle on.
