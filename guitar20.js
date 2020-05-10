var config = {
    ROOT: 'http://localhost:3000',
}

function getNearestNote(chord) {
    chord = chord.length > 6 ? chord.split(".") : chord;
    var NearestNote;
    var i = 0;
    while (i < chord.length) {
        if (chord[i] != 'x' && chord[i] != 'X') {
            NearestNote = chord[i];
            break;
        }
        i++;
    }
    for (i = 0; i < chord.length; i++) {
        if ((chord[i] != 'x' && chord[i] != 'X') && (parseInt(chord[i]) < parseInt(NearestNote))) {
            NearestNote = chord[i];
        }
    }
    return NearestNote;
}

function FlatToSharp(key) {
    var flat = ['Db', 'Eb', 'Gb', 'Ab', 'Bb']
    var sharp = ['C#', 'D#', 'F#', 'G#', 'A#']
    if (flat.indexOf(key) != -1) {
        return sharp[flat.indexOf(key)];
    } else {
        return key;
    }
}

function SharpToFlat(key) {
    var flat = ['Db', 'Eb', 'Gb', 'Ab', 'Bb']
    var sharp = ['C#', 'D#', 'F#', 'G#', 'A#']
    if (sharp.indexOf(key) != -1) {
        return flat[sharp.indexOf(key)];
    } else {
        return key;
    }
}

function getFarthestNote(chord) {
    chord = chord.length > 6 ? chord.split(".") : chord;
    var NearestNote;
    var i = 0;
    while (i < chord.length) {
        if (chord[i] != 'x' && chord[i] != 'X') {
            NearestNote = chord[i];
            break;
        }
        i++;
    }
    for (i = 0; i < chord.length; i++) {
        if ((chord[i] != 'x' && chord[i] != 'X') && (parseInt(chord[i]) > parseInt(NearestNote))) {
            NearestNote = chord[i];
        }
    }
    return NearestNote;
}
function setSelected(id, value, isRoot) {
    if (!value) { return }
    if (isRoot) {
        var isExist = false;
        $.each($('#' + id + ' option'), function (key, val) {
            if ($(this).val() === value) {
                $(this).attr('selected', 'selected');
                isExist = true;
            }
        })
        if (!isExist) {
            $.each($('#' + id + ' option'), function (key, val) {
                $(this).val(SharpToFlat($(this).val()));
                $(this).text(SharpToFlat($(this).val()));
            })
            $.each($('#' + id + ' option'), function (key, val) {
                if ($(this).val() === value) {
                    $(this).attr('selected', 'selected');
                }
            })
        }
    } else {
        $.each($('#' + id + ' option'), function (key, val) {
            if ($(this).val() === value) {
                $(this).attr('selected', 'selected');
                return
            }
        })
    }
}
function DrawCircle(context, stringDistance, startX, startY) {
    context.beginPath();
    context.arc(startX, startY, stringDistance * 3 / 8, 0, 2 * Math.PI);
    context.fillStyle = "black";
    context.fill();
    context.stroke();
}

function DrawBlackBorderCirble(context, stringDistance, startX, startY) {
    context.beginPath();
    context.arc(startX, startY, stringDistance * 2 / 5, 0, 2 * Math.PI);
    context.stroke();
}

function DrawCross(context, stringDistance, startX, startY) {
    var distance = stringDistance / 2;
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineWidth = 1.5;
    context.lineTo(startX + distance, startY + distance);
    context.stroke();
    context.beginPath();
    context.moveTo(startX, startY + distance);
    context.lineWidth = 1.5;
    context.lineTo(startX + distance, startY);
    context.stroke();
}
function TransposeUp_Half(key) {
    if (key[1] === 'b') { return key[0]; }
    if (key[0] === 'E' && key.length == 1) { return 'F'; }
    if (key[0] === 'B' && key.length == 1) { return 'C'; }
    if (key[1] === '#') {
        if (key[0] === 'G') { return 'A'; }
        return String.fromCharCode(key[0].charCodeAt(0) + 1);
    }
    return key + '#';
}
function TransposeUp(start_Key, fr) {
    var new_Key = start_Key;
    for (var i = 0; i < fr; i++) {
        new_Key = this.TransposeUp_Half(new_Key);
    }
    return new_Key;
}
function DrawChordText(context, content, startX, startY, textColor) {
    if (content.length > 1) {
        if (content.length > 3) {
            context.font = '13px Calibri';
            context.fillStyle = textColor;
            context.fillText(content, startX - 5, startY - 1.5);
            return
        }
        context.font = '16px Calibri';
        context.fillStyle = textColor;
        context.fillText(content, startX - 3.5, startY);
    } else {
        context.font = '18px Calibri';
        context.fillStyle = textColor;
        context.fillText(content, startX, startY);
    }

}
function drawLine(context, startX, startY, endX, endY, lineWidth, color) {
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineWidth = lineWidth;
    context.lineTo(endX, endY);
    context.strokeStyle = color;
    context.stroke();
}
//main function
function drawChord(chord, chord_letter, chord_type, idCanvas) {
    console.log(chord_letter)
    console.log(chord_type)
    if (!chord_letter || chord_letter == '') { chord_type = "None" }
    
    chord = chord.toString();
    chord_letter = chord_letter.toString();
    chord = chord.length > 6 ? chord.split(".") : chord.split("");
    chord_letter = chord_letter.length > 6 ? chord_letter.split(".") : chord_letter.split("");
    var c = document.getElementById(idCanvas);
    var ctx = c.getContext("2d");
    var stringWidth = 2;
    var stringDistance = 30;
    var is0Freet = false;
    if (getFarthestNote(chord) <= 5 || getNearestNote(chord) === '0') {
        is0Freet = true;
    }
    if (is0Freet) {
        var FirstFreetWidth = stringWidth * 2;
    }
    else {
        var FirstFreetWidth = stringWidth;
        ctx.font = '18px Calibri';
        ctx.fillText(getNearestNote(chord) + " fr", stringDistance * 6 + 15, stringDistance + 18);
    }


    ctx.moveTo(stringDistance, stringDistance + 2);
    ctx.lineWidth = FirstFreetWidth;
    ctx.lineTo(stringDistance * 6 + stringWidth, stringDistance + 2);
    ctx.stroke();

    var i = 0;
    ctx.lineWidth = stringWidth;
    for (i = stringDistance + 1; i < stringDistance * 7; i += stringDistance) {
        ctx.moveTo(i, 5 + stringDistance - 2);

        ctx.lineTo(i, stringDistance * 5 + stringWidth + stringDistance);
        ctx.stroke();
    }

    for (i = 1; i <= 5; i++) {
        ctx.moveTo(stringDistance, stringDistance * i + stringWidth + stringDistance);
        ctx.lineTo(stringDistance * 6 + stringWidth, stringDistance * i + stringWidth + stringDistance);
        ctx.stroke();
    }
    for (i = 0; i < chord.length; i++) {
        var isNote0 = false;
        var textColor = "white";
        if (chord[i] == 'x' || chord[i] == 'X') {
            DrawCross(ctx, stringDistance, i * stringDistance + stringDistance * 7 / 9, 10);
        } else {

            var positionX;
            var positionY;
            if (is0Freet) {
                positionX = (stringDistance * (i + 1));
                positionY = (stringDistance * (parseInt(chord[i]) + 1)) - stringDistance / 2.35;

            } else {
                positionX = (stringDistance * (i + 1));
                positionY = (stringDistance * (parseInt(chord[i]) - parseInt(getNearestNote(chord)) + 2)) - stringDistance / 2.35;
            }
            if (chord[i] == '0') {
                DrawBlackBorderCirble(ctx, stringDistance, i * stringDistance + stringDistance, 15);
                isNote0 = true;
                textColor = "black";
            } else {
                DrawCircle(ctx, stringDistance, positionX, positionY);
            }

            ctx.font = '19px Calibri';
            switch (chord_type) {
                case "None":
                    break;
                case "Finger":
                    if (isNote0) { break; }
                    DrawChordText(ctx, chord_letter[i], positionX - 5, positionY + 5, textColor);
                    break;
                case "Letter":
                    DrawChordText(ctx, chord_letter[i], positionX - 5, positionY + 5, textColor);
                    break;
                case "Tone":
                    DrawChordText(ctx, chord_letter[i], positionX - 5, positionY + 5, textColor);
                    break;
            }

        }
    }
}

//Vẽ 1 vòng tròn
function drawScaleCircle(context, distance, startX, startY, fill) {
    context.beginPath();
    context.arc(startX, startY, distance, 0, 2 * Math.PI);
    if (fill != null) {
        context.fillStyle = fill;
        context.fill();
    }
    context.stroke();
}
function drawScaleText(context, content, startX, startY, textColor, size, weight) {
    context.font = weight + ' ' + size + 'px Calibri';
    context.fillStyle = textColor;
    context.fillText(content, startX, startY);
}
//hàm vẽ khung sườn canvas
function drawSacle_Frame(ctx, stringWidth) {
    for (var i = 0; i < 6; i++) {
        drawLine(ctx, stringWidth + 60, 40 + i * stringWidth, 40 + stringWidth * 23 + 19, 40 + i * stringWidth, 2, 'black');
    }
    drawLine(ctx, stringWidth + 60 - 2, 40 - 1, stringWidth + 60 - 2, stringWidth * 6 + 8, 4, 'black')
    for (var i = 1; i <= 22; i++) {
        var distance = stringWidth * i;
        drawLine(ctx, (stringWidth + 60 - 2) + distance, 40, stringWidth + 60 - 2 + distance, stringWidth * 6 + 6, 2, 'black')
    }
    drawScaleText(ctx, 'E', stringWidth - 10, stringWidth + 12, 'black', '19', '600');
    drawScaleText(ctx, 'B', stringWidth - 10, stringWidth * 2 + 12, 'black', '19', '600');
    drawScaleText(ctx, 'G', stringWidth - 10, stringWidth * 3 + 12, 'black', '19', '600');
    drawScaleText(ctx, 'D', stringWidth - 10, stringWidth * 4 + 12, 'black', '19', '600');
    drawScaleText(ctx, 'A', stringWidth - 10, stringWidth * 5 + 12, 'black', '19', '600');
    drawScaleText(ctx, 'E', stringWidth - 10, stringWidth * 6 + 12, 'black', '19', '600');

    drawScaleText(ctx, 'E', stringWidth + 30, stringWidth + 12, 'black', '19', '500');
    drawScaleText(ctx, 'B', stringWidth + 30, stringWidth * 2 + 12, 'black', '19', '500');
    drawScaleText(ctx, 'G', stringWidth + 30, stringWidth * 3 + 12, 'black', '19', '500');
    drawScaleText(ctx, 'D', stringWidth + 30, stringWidth * 4 + 12, 'black', '19', '500');
    drawScaleText(ctx, 'A', stringWidth + 30, stringWidth * 5 + 12, 'black', '19', '500');
    drawScaleText(ctx, 'E', stringWidth + 30, stringWidth * 6 + 12, 'black', '19', '500');
    drawScaleText(ctx, 'Ngăn', 10, 14, 'black', '18', '500')
    for (var i = 0; i <= 22; i++) {
        drawScaleText(ctx, i, (i + 2) * stringWidth, 14, 'black', '18', '500')
    }
}
function drawArpeggio(chordType, Note, Label, isFlat, selectorID) {
    var stringWidth = 33;
    var c = document.getElementById(selectorID);
    var ctx = c.getContext("2d");
    drawSacle_Frame(ctx, stringWidth)
    Note = Note.split(".");
    Label = Label.split(".");

    var Sharp = ['C#', 'D#', 'F#', 'G#', 'A#'];
    var Flat = ['Db', 'Eb', 'Gb', 'Ab', 'Bb'];
    if (isFlat) {
        for (var i = 0; i < Note.length; i++) {
            if (Sharp.includes(Note[i])) {
                Note[i] = Flat[Sharp.indexOf(Note[i])];
                if (chordType === 'Note')
                    Label[i] = Flat[Sharp.indexOf(Label[i])];

            }
        }
    } else {
        for (var i = 0; i < Note.length; i++) {
            if (Flat.includes(Note[i])) {
                Note[i] = Sharp[Flat.indexOf(Note[i])];
                if (chordType === 'Note')
                    Label[i] = Sharp[Flat.indexOf(Label[i])];
            }
        }
    }
    var NowNote = ['E', 'A', 'D', 'G', 'B', 'E'].reverse();
    //first col
    for (var i = 0; i < 6; i++) {
        if (Note.includes(NowNote[i])) {
            drawScaleCircle(ctx, stringWidth * 2 / 5, 70, 6 + stringWidth * (i + 1), '#6a5acd');
            if (chordType !== "None") {
                //lấy note hiện tại
                var nowLabel = Label[Note.indexOf(NowNote[i])];
                drawScaleText(ctx, nowLabel, 67 - (nowLabel.length) * 2, 6 + stringWidth * (i + 1) + 5, 'white', (20 - nowLabel.length).toString(), '500')
            }
        }
        NowNote[i] = TransposeUp_Half(NowNote[i]);
    }
    for (var i = 0; i < 6; i++) {
        for (var j = 1; j <= 22; j++) {
            if (isFlat && Sharp.includes(NowNote[i])) {
                NowNote[i] = Flat[Sharp.indexOf(NowNote[i])];
            }
            if (Note.includes(NowNote[i])) {
                drawScaleCircle(ctx, stringWidth * 2 / 5, stringWidth * (j + 2) + 9, 6 + stringWidth * (i + 1), '#6a5acd');
                if (chordType !== "None") {
                    //lấy note hiện tại
                    var nowLabel = Label[Note.indexOf(NowNote[i])];
                    drawScaleText(ctx, nowLabel, stringWidth * (j + 2) + 4 - (nowLabel.length) * 2, 6 + stringWidth * (i + 1) + 5, 'white', (20 - nowLabel.length).toString(), '500')
                }
            }
            NowNote[i] = TransposeUp_Half(NowNote[i]);
        }
    }
}

//hàm vẽ scale
function drawScale(root, scale, label, type, isFlat, selectorID) {
    scale = scale.split(".");
    for (var i = 0; i < scale.length; i++) {
        scale[i] = TransposeUp(root, scale[i]);
    }
    scale = scale.join('.');
    if (type === "Note") {
        label = scale;
    }
    drawArpeggio(type, scale, label, isFlat, selectorID);
}
//Đọc file JSON từ local
function loadJSON(callback) {
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', '../lib/AllNote.json', true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            callback(JSON.parse(xobj.responseText));
        }
    };
    xobj.send(null);
}

//lên note để lấy bậc của note chuyển thành sound
function UpString(start_Key, fr, order) {
    var new_Key = start_Key;
    var order_Up = 0;
    for (var i = 0; i < fr; i++) {
        new_Key = this.TransposeUp_Half(new_Key);
        if (new_Key == 'C') { order_Up++; }
    }
    var x = {
        "Note": new_Key,
        "Order": ((fr / 12) | 0) + order + order_Up
    }
    return x;
}