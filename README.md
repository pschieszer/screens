# screens

I have long been a fan of [JWZ](https://www.jwz.org/), who developed the [xscreensaver](https://www.jwz.org/xscreensaver/) hacks. I had also recently been working with SVG in [another app](https://github.com/pschieszer/weatherCheck). I decided to see if I could implement one of the xscreensaver hacks as SVG. This is the result of that effort.

## Query string options

- "displayMode": "dots" is default
  - "[emojis](https://pschieszer.github.io/screens/rorschach.html?displayMode=emojis&pointCount=80&frameCount=5&delay=7500)": I love the randomness of the emoji mode, the accidental juxtaposition of the images. If it gets too cluttered it's too much to take in. Also the geometric point sources don't flatter the emoji mode, so the emojis look better with rorscach. Sometimes looks like if Tumblr and reddit had a baby.
  - "[dots](https://pschieszer.github.io/screens/rorschach.html?pointCount=80&frameCount=5&delay=7500)": classic mode, works well with higher pointCount values and geometric point sources
  - "[dude](https://pschieszer.github.io/screens/rorschach.html?displayMode=dude&pointCount=80&frameCount=5&delay=7500)": draws "the dude", a little stick figure guy. If the pointCount is greater than 200, browsers get slow and the screen is too cluttered. Works well with random mode.
- "pointCount": how many dots you want per frame
- "delay": how many milliseconds for all frames
- "frameCount": how many frames per delay, so a new frame every (delay / frameCount) milliseconds
- "spread": rorschach point source will group dots within this many pixels, hilbert will separate dots by this many
- "height": height in pixels of resulting image (default is current window height)
- "width": width in pixels of resulting image (default is current window width)
- "pointSource"
  - "[rorschach](https://pschieszer.github.io/screens/rorschach.html?pointCount=820&frameCount=5&delay=7500&spread=45)": classic rorschach pattern mode, with pixel symmetry changing randomly for more organic look. Make spread lower like 35 for tight groupings or greater than 85 for loose.
  - "[hilbert](https://pschieszer.github.io/screens/rorschach.html?pointSource=hilbert&pointCount=683&frameCount=5&delay=7500&spread=8)": colored hilbert curve fractal with points separated by spread pixels (default 5), pretty, would be better animated, pointCount values with interesting binary representations look cool in this source. Of course, if you prefer squares, lower spread to 2 or 3 and use a power of 2 for pointCount.
  - "[hexagon](https://pschieszer.github.io/screens/rorschach.html?pointSource=hexagon&pointCount=360&frameCount=5&delay=7500)": Hexagons. First point source that implements a regular polygon, so I had to work out how to interpolate points between vertexes. Point count above 400 probably overkill. The resulting hexagon will have pointCount modulo 6 dots per side, evenly spread.
  - "[5star](https://pschieszer.github.io/screens/rorschach.html?pointSource=5star&pointCount=360&frameCount=5&delay=7500)": Five pointed stars. Once I figured out the hexagon code, I realized I could refactor it into a shared bit of logic that would visit a set of vertexes in series. That meant shapes other than polygons, so I did the standard five pointed star as proof.
  - "[tangent](https://pschieszer.github.io/screens/rorschach.html?pointSource=tangent&pointCount=820&frameCount=5&delay=7500)": graph of tangent curves. Second, right after sinus.
  - "[sinus](https://pschieszer.github.io/screens/rorschach.html?pointSource=sinus&pointCount=820&frameCount=5&delay=7500)": graph of sine waves. First source developed after rorschach.
  - "[square](https://pschieszer.github.io/screens/rorschach.html?pointSource=square&pointCount=820&frameCount=5&delay=7500)": graph of a fifth order Fourier series approximation of a square wave. Currently my favorite because the math was hard.
  - "[arch](https://pschieszer.github.io/screens/rorschach.html?pointSource=arch&frameCount=5&delay=7500)": The St. Louis Arch. Trying out a color rotation on this one, like the look. 
  - "[sawtooth](https://pschieszer.github.io/screens/rorschach.html?pointSource=sawtooth&pointCount=820&frameCount=5&delay=7500)": graph of a sawtooth wave. Not happy with this one, needs work.
  - "[random](https://pschieszer.github.io/screens/rorschach.html?pointSource=random&pointCount=820&frameCount=5&delay=7500)": every frame, randomly picks one of the other options. Very mishmash, kind of cool.


## A Brief Description of a Nerdy Journey

I wanted to implement an xscreensaver hack as an SVG. That means I needed an xscreensaver hack to start from. I downloaded the source and just dove in. The hacks are written in C for X Windows and I figured I would try to do the smallest one, so I found the shortest .c file was [rorschach](https://www.youtube.com/watch?v=G1OLn4Mdk5Y). Visually attractive, and it was dots on a black surface. That seems like an easy thing to do in SVG, so it was the right one to attempt. Since the source code was in C and I was targeting ES6 Javascript, I was reading the source to get the idea.

There was an array getting filled with x, y, and color values, and then sent to an API. Well I could mimic the random dot logic (with the related symmetry elements) with a [generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*), because I hate large arrays.

The next step was getting a dot in the image. Made sense to me to use a circle tag, with a small radius and a fill. Randomly choosing a color was easy.

So I had x and y values from a generator, that I could run a mapping on to turn them into tags. Put them all in a group tag, then set up timers to add and remove them from the parent svg tag, and it would all blink very nicely.

Once I got the base Rorshach logic working (x and y points, turned into dots, blinks at the right times), I realized that the whole thing could be swapped around. Like, the x and y points could be calculated a different way, a sine wave, a tangent, a sawtooth wave, a square wave. Square wave was the hardest, spent a lot of time getting the math right.

And I wasn't stuck with just dots. Emojis would be easy to produce too. So I added "display modes", where you could select emojis instead of dots. Emojis don't work as nicely as I would like. You have to set the point count lower or the screen is too cluttered, and some of the emojis don't look great on certain OSes.

I added parameters to the query string. Some of the parameters work better in combination with one another. Play around with them to find a happy spot.

Recently, the geometric point sources were updated to vary the frequency used. Additionally, the sawtooth mode was modified, continues to need work.