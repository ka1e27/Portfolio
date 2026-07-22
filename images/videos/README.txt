HOW TO ADD A VIDEO
==================

Every video spot on the site is driven by one attribute: data-video.
Find the video spot you want to fill (search index.html for data-video="")
and fill it one of two ways.

1) A LOCAL VIDEO FILE
   Drop your clip into this folder (images/videos/), then point the spot at it:
       data-video="images/videos/boat-run.mp4"
   Supported: .mp4, .webm, .mov
   Optional poster image (shown before play):
       data-poster="images/videos/boat-run-poster.jpg"
   The site renders a normal <video controls> player.

2) A YOUTUBE OR VIMEO LINK
   Paste the share URL straight into the attribute:
       data-video="https://www.youtube.com/watch?v=XXXXXXXXXXX"
       data-video="https://youtu.be/XXXXXXXXXXX"
       data-video="https://vimeo.com/XXXXXXXXX"
   The site renders a responsive 16:9 embed automatically.

Leave data-video="" (empty) and the spot shows a tidy placeholder until
you fill it in. No file or link is ever required.

Tip: keep local files small (720p/1080p, a few MB) so the page stays fast.
