(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){


const STRING_WIDTH = 33;

/*transpose up key to key + 1/2 
expamle : 
    input:C ->output: C#
    input:C# ->output: D
    input:Db ->output: D
*/
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
        new_Key = TransposeUp_Half(new_Key);
    }
    return new_Key;
}


class ScaleJS {
    constructor(){
        this.dataProvider = null;
    }
    // ==== set
    setDataProvider(prodiver) {
        this.dataProvider = prodiver;
    }
    render (element, scale, type, options = {}) {

        element.innerHTML = `<div>
            <canvas width="850" height="300"></canvas>
        </div>`;
        if(!scale) {
            this.onRender && this.onRender.bind(this)(element,scale,type);
        }else {
            const canvas = element.getElementsByTagName('canvas')[0];
            const ctx = canvas.getContext('2d');
            this.onRender && this.onRender.bind(this)(element,scale,type);
            this.drawScale(ctx, 'C','Note',scale.Value,scale.Tone,false, STRING_WIDTH)
        }

        //set Attribute 
        element.setAttribute('data-scale',scale.Value);
        element.setAttribute('data-scale-type',type);

    }

    drawScale(ctx,root, type, scale, label, isFlat, stringWidth) {
        let note = scale.split(".");
        for (var i = 0; i < scale.length; i++) {
            note[i] = TransposeUp(root, scale[i]);
        }
        note = note.join('.');
        if (type === "Note") {
            label = note;
        }
        this.drawArpeggio(ctx,type,note,label,isFlat,stringWidth)
    }
    drawArpeggio(ctx, chordType = 'None', Note, Label, isFlat, stringWidth) {

        this.drawScaleFrame(ctx, stringWidth)
        Note = Note.split(".");
        Label = Label.split(".");
        var SHARP = ['C#', 'D#', 'F#', 'G#', 'A#'];
        var FLAT = ['Db', 'Eb', 'Gb', 'Ab', 'Bb'];
        if (isFlat) {
            for (var i = 0; i < Note.length; i++) {
                if (SHARP.includes(Note[i])) {
                    Note[i] = FLAT[SHARP.indexOf(Note[i])];
                    if (chordType === 'Note')
                        Label[i] = FLAT[SHARP.indexOf(Label[i])];
    
                }
            }
        } else {
            for (var i = 0; i < Note.length; i++) {
                if (FLAT.includes(Note[i])) {
                    Note[i] = SHARP[FLAT.indexOf(Note[i])];
                    if (chordType === 'Note')
                        Label[i] = SHARP[FLAT.indexOf(Label[i])];
                }
            }
        }
        var NowNote = ['E', 'A', 'D', 'G', 'B', 'E'].reverse();
        console.log(Note,NowNote)
        //first col
        for (var i = 0; i < 6; i++) {
            if (Note.includes(NowNote[i])) {
                this.drawScaleCircle(ctx, stringWidth * 2 / 5, 70, 6 + stringWidth * (i + 1), '#6a5acd');
                if (chordType !== "None") {
                    //lấy note hiện tại
                    var nowLabel = Label[Note.indexOf(NowNote[i])];
                    this.drawScaleText(ctx, nowLabel, 67 - (nowLabel.length) * 2, 6 + stringWidth * (i + 1) + 5, 'white', (20 - nowLabel.length).toString(), '500')
                }
            }
            NowNote[i] = TransposeUp_Half(NowNote[i]);
        }
        
        for (var i = 0; i < 6; i++) {
            for (var j = 1; j <= 22; j++) {
                if (isFlat && SHARP.includes(NowNote[i])) {
                    NowNote[i] = FLAT[SHARP.indexOf(NowNote[i])];
                }
                if (Note.includes(NowNote[i])) {
                    this.drawScaleCircle(ctx, stringWidth * 2 / 5, stringWidth * (j + 2) + 9, 6 + stringWidth * (i + 1), '#6a5acd');
                    if (chordType !== "None") {
                        //lấy note hiện tại
                        var nowLabel = Label[Note.indexOf(NowNote[i])];
                        this.drawScaleText(ctx, nowLabel, stringWidth * (j + 2) + 4 - (nowLabel.length) * 2, 6 + stringWidth * (i + 1) + 5, 'white', (20 - nowLabel.length).toString(), '500')
                    }
                }
                NowNote[i] = TransposeUp_Half(NowNote[i]);
            }
        }
    }
    drawScaleText(ctx, content, startX, startY, textColor, size, weight) {
        ctx.beginPath();
        ctx.font = weight + ' ' + size + 'px Calibri';
        ctx.fillStyle = textColor;
        ctx.fillText(content, startX, startY);
        ctx.stroke();
    }

    drawLine(ctx, startX, startY, endX, endY, lineWidth, color) {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineWidth = lineWidth;
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = color;
        ctx.stroke();
    }

    drawScaleCircle(ctx, distance, startX, startY, fill) {
        ctx.beginPath();
        ctx.arc(startX, startY, distance, 0, 2 * Math.PI);
        if (fill != null) {
            ctx.fillStyle = fill;
            ctx.fill();
        }
        ctx.stroke();
    }
    drawScaleFrame(ctx, stringWidth) {
        for (var i = 0; i < 6; i++) {
            this.drawLine(ctx, stringWidth + 60, 40 + i * stringWidth, 40 + stringWidth * 23 + 19, 40 + i * stringWidth, 2, 'black');
        }
        this.drawLine(ctx, stringWidth + 60 - 2, 40 - 1, stringWidth + 60 - 2, stringWidth * 6 + 8, 4, 'black')
        for (var i = 1; i <= 22; i++) {
            var distance = stringWidth * i;
            this.drawLine(ctx, (stringWidth + 60 - 2) + distance, 40, stringWidth + 60 - 2 + distance, stringWidth * 6 + 6, 2, 'black')
        }
        this.drawScaleText(ctx, 'E', stringWidth - 10, stringWidth + 12, 'black', '19', '600');
        this.drawScaleText(ctx, 'B', stringWidth - 10, stringWidth * 2 + 12, 'black', '19', '600');
        this.drawScaleText(ctx, 'G', stringWidth - 10, stringWidth * 3 + 12, 'black', '19', '600');
        this.drawScaleText(ctx, 'D', stringWidth - 10, stringWidth * 4 + 12, 'black', '19', '600');
        this.drawScaleText(ctx, 'A', stringWidth - 10, stringWidth * 5 + 12, 'black', '19', '600');
        this.drawScaleText(ctx, 'E', stringWidth - 10, stringWidth * 6 + 12, 'black', '19', '600');
    
        this.drawScaleText(ctx, 'E', stringWidth + 30, stringWidth + 12, 'black', '19', '500');
        this.drawScaleText(ctx, 'B', stringWidth + 30, stringWidth * 2 + 12, 'black', '19', '500');
        this.drawScaleText(ctx, 'G', stringWidth + 30, stringWidth * 3 + 12, 'black', '19', '500');
        this.drawScaleText(ctx, 'D', stringWidth + 30, stringWidth * 4 + 12, 'black', '19', '500');
        this.drawScaleText(ctx, 'A', stringWidth + 30, stringWidth * 5 + 12, 'black', '19', '500');
        this.drawScaleText(ctx, 'E', stringWidth + 30, stringWidth * 6 + 12, 'black', '19', '500');
        this.drawScaleText(ctx, 'Ngăn', 10, 14, 'black', '18', '500')
        for (var i = 0; i <= 22; i++) {
            this.drawScaleText(ctx, i, (i + 2) * stringWidth, 14, 'black', '18', '500')
        }
    }
}
window.ScaleJS = new ScaleJS(); 
},{}]},{},[1]);
