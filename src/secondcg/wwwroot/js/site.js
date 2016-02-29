// Write your Javascript code.

//alert(JSON.stringify( convert({type:'rgb', r: 50, g: 50, b: 50}, 'lab') ));

var $file =   $('.image-file')[0]; // the input element of type file
var $canvas = $('#before')[0];
var $canvas2 = $('#after')[0];
var $color1 = $('.color1 input')[0];
var $color2 = $('.color2 input')[0];
var $range = $('.range')[0];
var $rangeValue = $('.rangeValue')[0];
var width = null;
var height = null;

$rangeValue.value = $range.value;

$('#before').mouseup(function (e) {
    var pos = findPos(this);
    var x = e.pageX - pos.x;
    var y = e.pageY - pos.y;
    var c = this.getContext('2d');
    var p = c.getImageData(x, y, 1, 1).data;
    $color1.value = rgbToHex(p[0], p[1], p[2]);
});

function fitToImage(canvas, img) {
    // Make it visually fill the positioned parent
    canvas.style.width = img.width.toString() + 'px';
    canvas.style.height = img.height.toString() + 'px';
    // ...then set the internal size to match
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}

$range.onchange = function () {
    $rangeValue.value = $range.value;
}

$('.filter button')[0].onclick = function () {
    loadImage();
}

$file.onchange = function (e) {
    var ctx = $canvas.getContext('2d'); // load context of canvas
    var img = new Image();
    img.src = URL.createObjectURL(e.target.files[0]); // use first selected image from input element
    img.onload = function () {
        fitToImage($canvas, img);
        fitToImage($canvas2, img);
        width = img.width;
        height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height); // draw the image to the canvas
    }
}

function findPos(obj) {
    var curleft = 0, curtop = 0;
    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
        return { x: curleft, y: curtop };
    }
    return undefined;
}

function loadImage() {
    if (width == null || height == null)
        return;

    var fromRgb = hexToRgb($color1.value);
    var fromLab = rgbToLab(fromRgb);
    var square = $range.value * $range.value;

    if (square === 0) {
        var needToModify = function (imageData, index) {
            return imageData[index] == fromRgb.r &&
                   imageData[index + 1] == fromRgb.g &&
                   imageData[index + 2] == fromRgb.b;
        };
    } else {
        var needToModify = function (imageData, index) {
            var currentLab = rgbToLab({
                r: imageData[index],
                g: imageData[index + 1],
                b: imageData[index + 2]
            });

            return getRadiusSquare(currentLab, fromLab) <= square;
        };
    }

    var delta = getDelta(fromLab, rgbToLab(hexToRgb($color2.value)));
        
    var newContext = $canvas2.getContext('2d');
    newContext.clearRect(0, 0, $canvas2.width, $canvas2.height);

    var imageData = $canvas.getContext('2d').getImageData(0, 0, $canvas.width, $canvas.height);
    var data = imageData.data;

    for (var i = 0; i < data.length; i += 4) {
        if (!needToModify(data, i))
            continue;

        var rgb = {
            r: data[i],
            g: data[i + 1],
            b: data[i + 2]
        };
        var lab = rgbToLab(rgb);
        lab = addDelta(lab, delta);
        rgb = labToRgb(lab)

        data[i] = rgb.r;
        data[i + 1] = rgb.g;
        data[i + 2] = rgb.b;
    }

    newContext.putImageData(imageData, 0, 0);
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function hexToRgb(hex) {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        type: 'rgb'
    } : null;
}

function rgbToLab(rgb) {
    function rgbToXyz(rgb) {
        return {
            x: (0.4124564 * rgb.r + 0.3575761 * rgb.g + 0.1804375 * rgb.b) / 255 * 100,
            y: (0.2126729 * rgb.r + 0.7151522 * rgb.g + 0.0721750 * rgb.b) / 255 * 100,
            z: (0.0193339 * rgb.r + 0.1191920 * rgb.g + 0.9503041 * rgb.b) / 255 * 100
        };
    }

    var xyz = rgbToXyz(rgb);
    var f = function (t) {
        if (t > Math.pow(6 / 29, 3))
            return Math.pow(t, 1 / 3);
        else
            return t * 841 / 108 + 4 / 29;
    };

    return {
        l: 116 * f(xyz.y / 100.0) - 16,
        a: 500 * (f(xyz.x / 95.047) - f(xyz.y / 100.0)),
        b: 200 * (f(xyz.y / 100.0) - f(xyz.z / 108.883))
    };
}

function labToRgb(lab) {
    function xyzToRgb(xyz) {
        return {
            r: (3.2404542 * xyz.x - 1.5371385 * xyz.y - 0.4985314 * xyz.z) / 100 * 255,
            g: (-0.9692660 * xyz.x + 1.8760108 * xyz.y + 0.0415560 * xyz.z) / 100 * 255,
            b: (0.0556434 * xyz.x - 0.2040259 * xyz.y + 1.0572252 * xyz.z) / 100 * 255
        };
    }

    var f = function (t) {
        if (t > 6 / 29)
            return t * t * t;
        else
            return 108 / 841 * (t - 4 / 29);
    };

    var xyz = {
        x: 95.047 * f((lab.l + 16) / 116 + lab.a / 500),
        y: 100 * f((lab.l + 16) / 116),
        z: 108.883 * f((lab.l + 16) / 116 - lab.b / 200)
    }

    return xyzToRgb(xyz);
}

function getDelta(labA, labB) {
    return {
        l: labB.l - labA.l,
        a: labB.a - labA.a,
        b: labB.b - labA.b
    };
}

function addDelta(lab, delta) {
    return {
        l: lab.l + delta.l,
        a: lab.a + delta.a,
        b: lab.b + delta.b
    };
}

function getRadiusSquare(labA, labB) {
    var x = labB.l - labA.l;

    var c1 = Math.sqrt(labA.a * labA.a + labA.b * labA.b);
    var c2 = Math.sqrt(labB.a * labB.a + labB.b * labB.b);
    var dc = (c2 - c1);
    var da = labB.a - labA.a;
    var db = labB.b - labA.b;

    var sc = 1 + 0.045 * c1;
    var y = dc / sc;

    var dhSum = da * da + db * db - dc * dc;
    if (dhSum < 0)
        var dh = 0;
    else
        var dh = Math.sqrt(dhSum);
    var sh = 1 + 0.015 * c1;
    var z = dh / sh;

    return x * x + y * y + z * z;
}

function radiusSquare(labA, labB) {
    var l = labA.l - labB.l;
    var a = labA.a - labB.a;
    var b = labA.b - labB.b;
    return l * l + a * a + b * b;
}