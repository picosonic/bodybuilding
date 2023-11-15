// Based on :
//
// PROGRAM BODY
// VERSION 0.03
// AUTHOR  B.WALKER
// BEEBUG  MARCH 1994
// PROGRAM SUBJECT TO COPYRIGHT

// Global constants
const XMAX=320;
const YMAX=180;

var olxp=0; var olyp=0; // leftmost point
var orxp=0; var oryp=0; // rightmost point
var angle=0; // rotation angle/10
const vdist=2000; //viewing distance
const zoom=200; // scale of drawing
const h=1000;
const framerate=15;

var gs={
  // canvas
  canvas:null,
  ctx:null,
  scale:1,

  // animation frame of reference
  step:(1/framerate), // target step time @ 60 fps
  acc:0, // accumulated time since last frame
  lasttime:0, // time of last frame
  fps:0, // current FPS
  frametimes:[], // array of frame times

  // lookup tables
  s:new Array(35),
  c:new Array(35),
  si:new Array(35),
  co:new Array(35)
};

// Handle resize event to maintain aspect ratio
function playfieldsize()
{
  var height=window.innerHeight;
  var ratio=XMAX/YMAX;
  var width=Math.floor(height*ratio);
  var top=0;
  var left=Math.floor((window.innerWidth/2)-(width/2));

  if (width>window.innerWidth)
  {
    width=window.innerWidth;
    ratio=YMAX/XMAX;
    height=Math.floor(width*ratio);

    left=0;
    top=Math.floor((window.innerHeight/2)-(height/2));
  }
 
  gs.scale=(height/YMAX);

  // Canvas
  gs.canvas.style.top=top+"px";
  gs.canvas.style.left=left+"px";
  gs.canvas.style.transformOrigin='0 0';
  gs.canvas.style.transform='scale('+gs.scale+')';
}

function rad(degrees)
{
  return (degrees*(Math.PI/180));
}

// Build lookup table and ellipse
function buildlookup()
{
  const ff=0.3; // fiddles elipses, 0=no fiddle

  for (var i=0; i<36; i++)
  {
    gs.si[i]=Math.sin(rad(i*10));
    gs.co[i]=Math.cos(rad(i*10));
    gs.s[i]=gs.si[i]*(1+gs.co[i]*gs.co[i]*ff);
    gs.c[i]=gs.co[i]*(1+gs.si[i]*gs.si[i]*ff);
  }
}

// Map 3D coords to 2D screen coords
function m(x, y, z)
{
  var d, rx, ry;
  
  rx=x*gs.co[angle]+y*gs.si[angle];
  ry=-x*gs.si[angle]+y*gs.co[angle];
  d=zoom/(vdist-ry);
  xp=rx*d;
  yp=(z-h)*d;
}

function move(x, y)
{
  gs.ctx.moveTo(x+(XMAX/2), YMAX-(y+(YMAX/2))-15);
}

function draw(x, y)
{
  gs.ctx.lineTo(x+(XMAX/2), YMAX-(y+(YMAX/2))-15);
}

// Draw ellipse, return leftmost and rightmost points
function e(xoff, yoff, z, a, b, link)
{
  // XOFF,YOFF = center of ellipse
  // ellipse is in plane z=Z
  // ellipse dia on x axis =A
  // ellipse dia on y axis =B
  // LINK=TRUE to join this and last ellipse
  
  var x, y, k;
  
  x=xoff; y=b+yoff; // start of ellipse
  m(x, y, z);
  
  move(xp, yp);
  
  lxp=xp; lyp=yp; // leftmost point
  rxp=xp; ryp=yp; // rightmost point

  for (k=4; k<36; k+=4)
  {
    x=a*gs.s[k]+xoff;
    y=b*gs.c[k]+yoff;
    
    m(x, y, z);
  
    draw(xp, yp);
    
    if (xp<lxp)
    {
      lxp=xp;
      lyp=yp;
    }
    
    if (xp>rxp)
    {
      rxp=xp;
      ryp=yp;
    }
  }
  
  x=xoff; y=b+yoff;
  
  m(x, y, z);
  
  draw(xp, yp); // REM close ellipse
  
  if (link)
  {
    move(olxp, olyp);
    draw(lxp, lyp);
    move(orxp, oryp);
    draw(rxp, ryp);
  }
  
  olxp=lxp; olyp=lyp;
  orxp=rxp; oryp=ryp; 
}

// Draw one leg
function leg(side)
{
  var i, x, y, z, a, b;
  
  const c=12; // Number of ellipses
  
  // Data for one leg
  const legdata=[ // x, y, z of ellipse centre, axes of ellipse
    [240,160,0,40,120],
    [235,100,60,38,60],
    [225,90,120,48,50],
    [210,80,180,58,55],
    [200,75,240,63,55],
    [190,75,300,55,55],
    [180,75,360,48,50],
    [160,85,420,50,48],
    [155,95,480,45,63],
    [145,80,540,58,65],
    [130,80,600,70,73],
    [103,80,660,95,80]
  ];

  for (i=0; i<c; i++)
  {
    x=legdata[i][0];
    y=legdata[i][1];
    z=legdata[i][2];
    a=legdata[i][3];
    b=legdata[i][4];
    
    e(x*side, y, z, a, b, i!=0);
  }
}

// Draw torso
function torso()
{
  var i, x, y, z, a, b;
  
  const c=9; // Number of ellipses
  
  // Data for torso
  const torsodata=[ // x, y, z of ellipse centre, axes of ellipse
    [0,85,720,185,83],
    [0,85,780,175,85],
    [0,85,840,160,83],
    [0,90,900,150,85],
    [0,100,960,140,90],
    [0,105,1020,145,95],
    [0,115,1080,150,100],
    [0,130,1140,155,105],
    [0,120,1200,170,113]
  ];
  
  for (i=0; i<c; i++)
  {
    x=torsodata[i][0];
    y=torsodata[i][1];
    z=torsodata[i][2];
    a=torsodata[i][3];
    b=torsodata[i][4];
    
    e(x, y, z, a, b, true);
  }
}

// Draw one arm
function arm(side)
{
  var i, x, y, z, a, b;
  
  const c=10; // Number of ellipses
  
  // Data for one arm
  const armdata=[ // x, y, z of ellipse centre, axes of ellipse
    [330,145,660,10,5],
    [320,135,720,45,28],
    [320,130,780,40,23],
    [315,120,840,30,25],
    [310,105,900,38,35],
    [310,100,960,38,40],
    [300,100,1020,40,43],
    [290,90,1080,48,40],
    [265,85,1140,53,55],
    [230,85,1200,60,75]
  ];

  for (i=0; i<c; i++)
  {
    x=armdata[i][0];
    y=armdata[i][1];
    z=armdata[i][2];
    a=armdata[i][3];
    b=armdata[i][4];
    
    e(x*side, y, z, a, b, i!=0);
  }
}

// Draw one head
function head()
{
  var i, x, y, z, a, b;
  
  const c=12; // Number of ellipses
  
  // Data for head and shoulders
  const headdata=[ // x, y, z of ellipse centre, axes of ellipse
    [0,115,1260,280,115],
    [0,105,1320,268,105],
    [0,85,1380,220,80],
    [0,75,1440,78,43],
    [0,115,1470,110,78],
    [0,100,1500,123,88],
    [0,105,1530,128,108],
    [0,100,1560,125,100],
    [0,95,1590,115,95],
    [0,90,1620,100,90],
    [0,85,1650,75,70],
    [0,90,1680,30,25]
  ];
  
  for (i=0; i<c; i++)
  {
    x=headdata[i][0];
    y=headdata[i][1];
    z=headdata[i][2];
    a=headdata[i][3];
    b=headdata[i][4];
    
    e(x, y, z, a, b, true);
  }
}

function drawbody()
{
  // Draw legs, Draw torso, Join legs with torso
  // Draw Arms, Draw head, Join arms with head

  gs.ctx.beginPath();

  leg(-1);
  
  var t_lx=olxp; var t_ly=olyp;
  var t_rx=orxp; var t_ry=oryp;
  
  leg(1);
  
  if (t_lx<olxp)
  {
    olxp=t_lx;
    olyp=t_ly;
  }
  
  if (t_rx>orxp)
  {
    orxp=t_rx;
    oryp=t_ry;
  }
  
  torso();
  
  t_lx=olxp; t_ly=olyp;
  t_rx=orxp; t_ry=oryp;
  
  arm(-1);
  
  if (olxp<t_lx)
  {
    t_lx=olxp;
    t_ly=olyp;
  }
  
  if (orxp>t_rx)
  {
    t_rx=orxp;
    t_ry=oryp;
  }
  
  arm(1);

  if (t_lx<olxp)
  {
    olxp=t_lx;
    olyp=t_ly;
  }
  
  if (t_rx>orxp)
  {
    orxp=t_rx;
    oryp=t_ry;
  }
  
  head();
  
  gs.ctx.stroke();
}

function redraw()
{
  // Clear the tile canvas
  gs.ctx.fillStyle=("#555");
  gs.ctx.fillRect(0, 0, gs.canvas.width, gs.canvas.height);

  // Draw the model
  drawbody();
}

function rafcallback(timestamp)
{
  // First time round, just save epoch
  if (gs.lasttime>0)
  {
    // Determine accumulated time since last call
    gs.acc+=((timestamp-gs.lasttime) / 1000);

    // If it's more than 15 seconds since last call, reset
    if ((gs.acc>gs.step) && ((gs.acc/gs.step)>(framerate*15)))
      gs.acc=gs.step*2;

    // Process "steps" since last call
    while (gs.acc>gs.step)
    {
      angle++;
  
      if (angle>35) angle=0;
  
      gs.acc-=gs.step;
    }

    redraw();
  }

  // Remember when we were last called
  gs.lasttime=timestamp;

  window.requestAnimationFrame(rafcallback);
}

function init()
{
  // Set up tiles canvas
  gs.canvas=document.getElementById("canvas");
  gs.ctx=gs.canvas.getContext("2d");

  window.addEventListener("resize", function() { playfieldsize(); });

  playfieldsize();

  buildlookup();

  window.requestAnimationFrame(rafcallback);
}

// Run the init() once page has loaded
window.onload=function() { init(); };
