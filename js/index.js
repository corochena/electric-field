/////////////////////
//////// Main program
/////////////////////

// crea el canvas, context y obtiene sus atributos width y height
var canvas = document.querySelector("canvas");
var width = canvas.getAttribute("width");
var height = canvas.getAttribute("height");
var ctx = canvas.getContext("2d");
var cargas = [];

setInterval(main, 200);

function main() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);

  cargas.forEach(function(q) {
    q.draw(ctx);
  });

  // crea un arreglo random de nPuntos [x, y]
  var puntos = [];
  var nPuntos = 2000;
  for (var i = 0; i < nPuntos; i++) {
    puntos.push([width * Math.random(), height * Math.random()]);
  }

  // dibuja los puntos que no estan dentro de ninguna carga, calcula el campo E producido
  // por el arreglo de cargas y lo dibuja
  puntos
    .filter(function(p) {
      for (q of cargas) if (q.in(p)) return false;
      return true;
    })
    .forEach(function(p) {
      drawCircle(p, 0.5, "black", ctx);
      var vectorE = cargas.reduce(function(e, q) {
        return e.sum(q.vectorE(p));
      }, new Vector());
      vectorE.draw(p, ctx);
    });
}

///////////// Event listeners

canvas.addEventListener("click", function(e) {
  var m = Number(document.querySelector("#magnitud").value);
  var r = Number(document.querySelector("#radio").value);
  var nCargas = Number(document.querySelector("#nCargas").value);
  var rCirc = Number(document.querySelector("#rCirc").value);
  var largo = Number(document.querySelector("#largo").value);
  var dist = document.querySelector("#distSelect").value;

  var pos = [e.offsetX, e.offsetY];

  if (dist == "puntual") cargas.push(new Carga(m, pos, r));
  else if (dist == "circular")
    cargas = cargas.concat(distCirc(nCargas, m, r, pos, rCirc));
  else if (dist == "linealVert")
    cargas = cargas.concat(distLinealVert(nCargas, m, r, pos, largo));
  else if (dist == "linealHoriz")
    cargas = cargas.concat(distLinealVert(nCargas, m, r, pos, largo, true));
});

document.querySelector("#distSelect").addEventListener("change", function(e) {
  var dist = e.target.value;
  if (dist == "puntual") {
    document.querySelector("#nCargas").disabled = true;
    document.querySelector("#rCirc").disabled = true;
    document.querySelector("#largo").disabled = true;
  } else if (dist == "circular") {
    document.querySelector("#nCargas").disabled = false;
    document.querySelector("#rCirc").disabled = false;
    document.querySelector("#largo").disabled = true;
  } else {
    document.querySelector("#nCargas").disabled = false;
    document.querySelector("#rCirc").disabled = true;
    document.querySelector("#largo").disabled = false;
  }
});

/////////////////////
//////// Carga constructor and methods
/////////////////////

function Carga(magnitud, pos, radio) {
  this.magnitud = magnitud;
  this.pos = pos;
  this.radio = radio;
}

Carga.prototype.vectorE = function(punto) {
  var qPos = new Vector(this.pos);
  var puntoPos = new Vector(punto);
  var v = puntoPos.sum(qPos.mEscalar(-1));
  var mult = 100 * this.magnitud;
  var rCuad = Math.pow(v.magnitud(), 2);
  return v.mEscalar(mult / rCuad);
};

Carga.prototype.draw = function(ctx) {
  var color, text;
  if (this.magnitud > 0) {
    color = "blue";
    text = "+";
  } else {
    color = "red";
    text = "-";
  }
  drawCircle(this.pos, this.radio, color, ctx);
  ctx.font = "15px Arial";
  ctx.fillStyle = color;
  ctx.fillText(text, this.pos[0] - 5, this.pos[1] + 3);
  ctx.stroke();
};

Carga.prototype.in = function(punto) {
  // true if punto inside charge
  return dist(this.pos, punto) < this.radio;
};

/////////////////////
//////// Vector constructor and methods
/////////////////////

function Vector(x, y) {
  if (y == undefined) y = 0;
  if (x == undefined) x = 0;
  if (typeof x == "object") {
    y = x[1];
    x = x[0];
  }
  this.x = x;
  this.y = y;
}

Vector.prototype.magnitud = function() {
  return dist([this.x, this.y]);
};

Vector.prototype.sum = function() {
  var x = this.x;
  var y = this.y;
  for (var i = 0; i < arguments.length; i++) {
    x += arguments[i].x;
    y += arguments[i].y;
  }
  return new Vector(x, y);
};

Vector.prototype.angle = function(degrees) {
  var ang = Math.atan2(this.y, this.x);
  return degrees ? ang * Math.PI / 180 : ang;
};

Vector.prototype.mEscalar = function(m) {
  return new Vector(m * this.x, m * this.y);
};

Vector.prototype.draw = function(origen, ctx, len, color) {
  if (color == undefined) color = rndColor();
  ctx.strokeStyle = color;
  ctx.moveTo(origen[0], origen[1]);
  if (typeof len == "number") {
    dx = len * Math.cos(this.angle());
    dy = len * Math.sin(this.angle());
    ctx.lineTo(origen[0] + dx, origen[1] + dy);
  } else ctx.lineTo(origen[0] + this.x, origen[1] + this.y);
  ctx.stroke();
};

// EJEMPLOS
// crea una distribucion de cargas y las dibuja
// var distPos = distCirc(14, 5, 10, [width / 3, height / 2], 40);
// var distNeg = distCirc(16, -1, 10, [2 * width / 3, height / 2], 60);
// cargas = distPos.concat(distNeg);

//var cargas = distLaminas(40, 1, 8, [width / 2, height / 2], 0.8 * height, 40);

//var cargas = distLineal(40, 1, 10, [width / 4, height / 2], [3 * width / 4, height / 2]);
//var cargas = distParalelas(30, 1, 8, [width / 2, 50], [width / 2, height - 50], 100);
//var q1 = distLineal(16, 1, 10, [300,100], [300,500]);
//var q2 = distLineal(16, -1, 10, [300,500], [800,500]);
//var cargas = q1.concat(q2);
// --------------------------------

// devuelve un arreglo de n cargas de magnitud y radio r,
// en forma de circulo centrado en pos y radio R
function distCirc(n, magn, r, pos, R, alt) {
  var cargas = [];
  for (var i = 0; i < n; i++) {
    var ang = i * 2 * Math.PI / n;
    var x = pos[0] + R * Math.cos(ang);
    var y = pos[1] + R * Math.sin(ang);
    if (alt) var q = new Carga(i % 2 == 0 ? magn : -magn, [x, y], r);
    else var q = new Carga(magn, [x, y], r);
    cargas.push(q);
  }
  return cargas;
}

// distribucion lineal de n cargas de magnitud magn y radio r
// ubicadas en los puntos P y Q
function distLineal(nCargas, magn, r, P, Q) {
  var cargas = [];
  var vectorP = new Vector(P);
  var vectorQ = new Vector(Q);
  var vectorPQ = vectorQ.sum(vectorP.mEscalar(-1));
  var vectorU = vectorPQ.mEscalar(1 / (nCargas - 1));
  for (var i = 0; i < nCargas; i++) {
    var x = vectorP.sum(vectorU.mEscalar(i)).x;
    var y = vectorP.sum(vectorU.mEscalar(i)).y;
    var q = new Carga(magn, [x, y], r);
    cargas.push(q);
  }
  return cargas;
}

function distLinealVert(nCargas, magn, r, centro, largo, horiz) {
  var P = [centro[0], centro[1]];
  var Q = [centro[0], centro[1]];
  var i = horiz ? 0 : 1;
  P[i] -= largo / 2;
  Q[i] += largo / 2;
  return distLineal(nCargas, magn, r, P, Q);
}

function distParalelas(nCargas, magn, r, P, Q, gap) {
  var neg = distLineal(
    nCargas,
    magn,
    r,
    [P[0] - gap / 2, P[1]],
    [Q[0] - gap / 2, Q[1]]
  );
  var pos = distLineal(
    nCargas,
    -magn,
    r,
    [P[0] + gap / 2, P[1]],
    [Q[0] + gap / 2, Q[1]]
  );
  return neg.concat(pos);
}

// distribucion de 2 laminas paralelas centradas en x, altura y, y separadas dx
// cargadas negativa y positiva de radio r y magnitud
function distLaminas(nPares, magn, r, pos, height, dx) {
  var cargas = [];
  for (var i = 0; i < nPares; i++) {
    var y = pos[1] - height / 2 + height / nPares * (i + 0.5);
    var qPos = new Carga(magn, [pos[0] - dx, y], r);
    var qNeg = new Carga(-magn, [pos[0] + dx, y], r);
    cargas.push(qPos, qNeg);
  }
  return cargas;
}

/////////////////////
//////// Helper functions
/////////////////////

function drawCircle(pos, rad, color, ctx) {
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(pos[0], pos[1], rad, 0, 2 * Math.PI);
  ctx.stroke();
}

function dist(A, B) {
  if (B == undefined) B = [0, 0];
  return Math.sqrt(Math.pow(A[0] - B[0], 2) + Math.pow(A[1] - B[1], 2));
}

function rndColor() {
  var colorNum = Math.floor(Math.random() * Math.pow(256, 3));
  var hex = colorNum.toString(16);
  return "#" + hex;
}