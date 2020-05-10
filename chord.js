/*
data.json generate script:
var b = {};
a.forEach(item => {
  var parts = item.split(',');
  b[parts[1]] = b[parts[1]] || [];
  b[parts[1]].push({
    name: parts[1].replace(/"/g, ''),
    priority: +parts[2],
    fingers: parts[3].replace(/"/g, '').split(' '),
    scheme: parts[4].replace(/"/g, '').split(' '),
  });
});
for (var name of Object.keys(b)) {
  b[name].sort((a, b) => a.priority > b.priority);
}
  Author: Trung Dinh Quang <trungdq88@gmail.com>
  Date: 04-Oct-16
  Please email me if you want to use this library in your project.
 *
 */

const GUITAR_CHORD = {};
const UKULELE_CHORD = require('./data/ukulele.json');
const Synth = require('./lib/audio-synth/audiosynth');
const guitarString = require('./data/guitar_all_string.json');
const SAME_NAMES = ['C#/Db', 'D#/Eb', 'F#/Gb', 'G#/Ab', 'A#/Bb'].reduce(
  (current, next) => {
    const parts = next.split('/');
    current[parts[0]] = parts[1];
    current[parts[1]] = parts[0];
    return current;
  },
  {}
);

/**
 * Test: getSameName('G#m'); // Abm
 * Test: getSameName('M'); // M
 */
const getSameName = name => {
  const findNameKey = Object.keys(SAME_NAMES).find(_ => name.indexOf(_) === 0);
  if (!findNameKey) return name;
  return name.replace(new RegExp('^' + findNameKey), SAME_NAMES[findNameKey]);
};

// C:0003(1234),0003(1234)
// Output:
// [{
// fingers: ['x', '0', '1', '2', '3', '0'],
// name: 'A',
// priority: 1,
// scheme: ['x', '0', '1', '2', '3', '0'],
// }]
const parseChord = code => {
  const result = [];
  if (!code) return false;

  const parts = code.split(':');
  if (parts.length < 2) return false;

  const name = parts[0];
  const variations = parts[1].split(',');
  variations.map((variation, index) => {
    const scheme = variation.split('(')[0].split('');
    const fingerPart = /\(([\dxX]+?)\)/.exec(variation);
    const fingers = fingerPart ? fingerPart[1].split('') : [];
    result.push({
      fingers,
      scheme,
      name,
      priority: index + 1,
    });
  });

  return result;
};

const splitWithDot = text => {
  if (text.indexOf('.') > -1) {
    return text.split('.');
  }

  return text.split('');
};

const parseChordV2 = (name, code = '') => {
  if (!code) return false;

  const variations = code.split(/[,\n]/).map(_ => _.trim());
  const result = [];

  variations.forEach((variation, index) => {
    const [schemeCode, fingerCode = ''] = variation.split('/');
    const scheme = splitWithDot(schemeCode);
    const fingers = splitWithDot(fingerCode);
    result.push({
      fingers,
      scheme,
      name,
      priority: index + 1,
    });
  });
  return result;
};

const StaticChordData = {
  get: (name, instrument = 'guitar') => {
    const getChordsForName = name => {
      switch (instrument) {
        case 'guitar':
          return parseChord(GUITAR_CHORD[name]);
        case 'ukulele':
          return parseChord(UKULELE_CHORD[name]);
        case 'piano':
          return false;
        default:
          throw new Error(`Instrument ${instrument} is not supported`);
      }
    };

    return getChordsForName(name) || getChordsForName(getSameName(name));
  },
};

// Variables
const WIDTH = 600;
const HEIGHT = 400;
const TOP_SPACE = 70;
const CHORD_WIDTH = 320;
const CHORD_HEIGHT = 300;
const STROKE_WIDTH = 3;
const FONT_SIZE = 35;
const LEFT_SPACE = (WIDTH - CHORD_WIDTH) / 2 - FONT_SIZE;
const STRING_SCALE = 6;
//piano env variable
const PIANO_LEFT_SPACE = LEFT_SPACE - 70;
const PIANO_WHITE_KEY_WIDTH = 70;
const PIANO_WHITE_KEY_HEIGHT = 320;
const PIANO_C = require('./data/piano_frame_c.json');
const PIANO_F = require('./data/piano_frame_f.json');

const getStringConfigs = (MAX_FRETS, STRINGS_NUM) => ({
  STRING_WIDTH: CHORD_WIDTH / (STRINGS_NUM - 1),
  FRET_HEIGHT: CHORD_HEIGHT / MAX_FRETS,
  CHORD_BOTTOM_OVERFLOW: CHORD_HEIGHT / MAX_FRETS / 2,
  FINGER_RADIUS:
    (Math.min(
      CHORD_WIDTH / STRINGS_NUM / (STRING_SCALE / STRINGS_NUM),
      CHORD_HEIGHT / MAX_FRETS
    ) *
      1.1) /
    2,
});

const getGuitarConfigs = () => {
  const MAX_FRETS = 4;
  const STRINGS_NUM = 6;
  return Object.assign(
    { MAX_FRETS, STRINGS_NUM },
    getStringConfigs(MAX_FRETS, STRINGS_NUM)
  );
};

const getUkuleleConfigs = () => {
  const MAX_FRETS = 4;
  const STRINGS_NUM = 4;
  return Object.assign(
    { MAX_FRETS, STRINGS_NUM },
    getStringConfigs(MAX_FRETS, STRINGS_NUM)
  );
};

const PIANO_WHITE_KEY_NUM = PIANO_F.filter(x => typeof x === 'string').length;
const getConfigs = instrument => {
  if (instrument === 'guitar') return getGuitarConfigs();
  if (instrument === 'ukulele') return getUkuleleConfigs();
  throw new Error(`Instrument ${instrument} is not supported`);
};

class ChordJS {
  constructor() {
    this.LANGUAGE = {
      finger: 'Thế tay',
      transpose: 'Đổi tông',
      selectInstrument: 'Chọn nhạc cụ',
      chordNotSupported: 'Hợp âm chưa hỗ trợ',
    };
    this.dataProvider = null;
  }

  setDataProvider(provider) {
    this.dataProvider = provider;
  }

  // IMPORTANT: keep this in sync with server side implementation
  transposeChord(chord, amount) {
    if (typeof chord == 'undefined') {
      return;
    }
    if (chord == '') {
      return;
    }
    function move(chord, step) {
      const notes = 'A A#,Bb B C C#,Db D D#,Eb E F F#,Gb G G#,Ab'
        .split(' ')
        .map(_ => _.split(','))
        .map(_ => (_[1] === undefined ? [_[0], _[0]] : [_[0], _[1]]));
      const found = notes
        .map((_, index) => [index, _.findIndex(c => c === chord)])
        .filter(_ => _[1] > -1);
      if (!found.length) return;
      const source = found[0];
      const newIndex = (notes.length + source[0] + step) % notes.length;
      const result = notes[newIndex][source[1]];
      return result;
    }
    var returnVal = chord.replace(/[CDEFGAB][#b]?/g, function(match) {
      return move(match, amount);
    });
    return returnVal;
  }

  render(element, name, position, instrument = 'guitar', options = {}) {
    if (
      !name ||
      (element.dataset.chord === name &&
        element.dataset.pos == position &&
        element.dataset.instrument === instrument)
    ) {
      return;
    }

    if (!position) position = 0;

    let chord = null;

    if (this.dataProvider) {
      var data = this.dataProvider(name, instrument);
      if (typeof data === 'string') {
        chord = {
          value: parseChordV2(name, data),
        };
      } else if (typeof data === 'object') {
        chord = {
          value: parseChordV2(name, data.details),
          note: data.note,
          tone: data.tone,
        };
        if (instrument === 'piano') {
          if (data.note) {
            chord.processedData = this.calculatePianoNote(
              data.note,
              splitWithDot(data.note)[0]
            );
          } else {
            chord = null;
          }
        }
      }
    }
    if (!chord || (!chord.length && !chord.value && instrument !== 'piano')) {
      chord = StaticChordData.get(name, instrument);
    }

    element.innerHTML = `
    <div style="
    background: #fff; width: ${
      instrument === 'piano' &&
      chord.processedData &&
      chord.processedData.endPosition
        ? chord.processedData.endPosition * 19
        : 150
    }px; height: 190px;
    text-align: center; position: relative"
    >
    <a
    class="change-instrument"
    href="javascript:;" style="
    position: absolute;
    top: 5px; right: 5px;
    font-size: 11px;
    text-decoration: underline;
    color: #555;
    ">${instrument}</a>
    <div
    class="change-instrument-popup"
    style="
    background: white;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.38);
    border: 1px solid #ccc;
    padding: 10px;
    display: none;
    ">
      <div style="margin-bottom: 10px">
        ${this.LANGUAGE.selectInstrument}
      </div>
      <div style="margin-bottom: 10px">
      <a
      class="change-instrument-guitar"
      style="
      font-size: 12px;
      ${
        instrument === 'guitar'
          ? 'font-weight: bold; text-decoration: underline; color: black;'
          : ' color: #969696;'
      }
      " href="javascript:;">Guitar</a>
      </div>
      <div style="margin-bottom: 10px">
      <a
      class="change-instrument-ukulele"
      style="
      font-size: 12px; color: #969696;
      ${
        instrument === 'ukulele'
          ? 'font-weight: bold; text-decoration: underline; color: black;'
          : ' color: #969696;'
      }
      " href="javascript:;">Ukulele</a>
      </div>
      <div style="margin-bottom: 10px">
      <a
      class="change-instrument-piano"
      style="
      font-size: 12px; color: #969696;
      ${
        instrument === 'piano'
          ? 'font-weight: bold; text-decoration: underline; color: black;'
          : ' color: #969696;'
      }
      " href="javascript:;">Piano</a>
      </div>
    </div>
    <div style="padding-top: 25px; font-size: 20px; font-weight: bold; white-space: nowrap;">
      ${name}
      <span
      class="play-sound"
      style=" cursor: pointer;
      font-size: 11px;">
        <svg xmlns="http://www.w3.org/2000/svg" version="1.0" width="15" height="15" viewBox="0 0 75 75">
        <path d="M39.389,13.769 L22.235,28.606 L6,28.606 L6,47.699 L21.989,47.699 L39.389,62.75 L39.389,13.769z" style="stroke:#111;stroke-width:5;stroke-linejoin:round;fill:#111;"/>
        <path d="M48,27.6a19.5,19.5 0 0 1 0,21.4M55.1,20.5a30,30 0 0 1 0,35.6M61.6,14a38.8,38.8 0 0 1 0,48.6" style="fill:none;stroke:#111;stroke-width:5;stroke-linecap:round"/>
        </svg>
      </span>
    </div>
    ${
      chord
        ? `<canvas style="height: 90px; width: ${
            instrument === 'piano' ? '100%' : 140
          }px;" width="${
            instrument === 'piano'
              ? (WIDTH * (chord.processedData.endPosition + 2.8)) / 10
              : WIDTH
          }" height="${HEIGHT}"></canvas>`
        : `<div style="height: 90; width: 100%; padding: 25px;text-align:center; box-sizing: border-box;">
      <i><small>${this.LANGUAGE.chordNotSupported}</small></i>
      </div>`
    }
    ${
      chord &&
      (chord.length || (chord.value && chord.value.length)) &&
      instrument !== 'piano'
        ? `
      <div style="font-size: 13px">
        <b class="finger-prev" style="cursor: pointer">◁</b>
        ${this.LANGUAGE.finger}
        <b class="finger-next"  style="cursor: pointer">▷</b>
      </div>
    `
        : `<div style="height: 1em"></div>`
    }
    ${
      options.hideTranspose
        ? ''
        : `
    <div style="font-size: 13px">
      <b class="chord-prev" style="cursor: pointer">◀</b>
      ${this.LANGUAGE.transpose}
      <b class="chord-next"  style="cursor: pointer">▶</b>
    </div>
    `
    }
    </div>
    `;

    if (!chord) {
      // console.error('Chord not supported: ', name);
      this.onRender && this.onRender.bind(this)(element, name, position);
    } else {
      const canvas = element.getElementsByTagName('canvas')[0];
      const ctx = canvas.getContext('2d');

      this.onRender && this.onRender.bind(this)(element, name, position);

      if (!position) position = 0;

      this.draw(ctx, chord, position, instrument);
    }

    element.setAttribute('data-chord', name);
    element.setAttribute('data-pos', position);
    element.setAttribute('data-instrument', instrument);
    const el = (...args) =>
      element.getElementsByClassName(...args)[0] || {
        addEventListener: () => {},
      };

    el('finger-prev').addEventListener('click', e => {
      const chordElement = element.getAttribute('data-chord');
      const pos = +element.getAttribute('data-pos');
      const instrument = element.getAttribute('data-instrument');
      let nextPos = pos - 1;
      const length = chord.value ? chord.value.length : chord.length;
      if (nextPos < 0) {
        nextPos = length - 1;
      }
      this.render(element, chordElement, nextPos, instrument, options);
    });

    el('finger-next').addEventListener('click', e => {
      const chordElement = element.getAttribute('data-chord');
      const pos = +element.getAttribute('data-pos');
      const instrument = element.getAttribute('data-instrument');
      let nextPos = pos + 1;
      const length = chord.value ? chord.value.length : chord.length;
      if (nextPos > length - 1) {
        nextPos = 0;
      }
      this.render(element, chordElement, nextPos, instrument, options);
    });

    el('chord-prev').addEventListener('click', e => {
      const manual =
        this.onTranspose && this.onTranspose.bind(this)(element, -1);
      if (manual) return;
      const chordElement = element.getAttribute('data-chord');
      const instrument = element.getAttribute('data-instrument');
      const nextChord = this.transposeChord(chordElement, -1);
      this.render(element, nextChord, 0, instrument, options);
    });

    el('chord-next').addEventListener('click', e => {
      const manual =
        this.onTranspose && this.onTranspose.bind(this)(element, 1);
      if (manual) return;
      const chordElement = element.getAttribute('data-chord');
      const instrument = element.getAttribute('data-instrument');
      const nextChord = this.transposeChord(chordElement, 1);
      this.render(element, nextChord, 0, instrument, options);
    });

    el('change-instrument').addEventListener('click', e => {
      el('change-instrument-popup').style.display = 'block';
    });

    el('change-instrument-guitar').addEventListener('click', e => {
      el('change-instrument-popup').style.display = 'none';
      const chordElement = element.getAttribute('data-chord');
      this.render(element, chordElement, 0, 'guitar', options);
      this.onInstrumentChange &&
        this.onInstrumentChange.bind(this)(element, 'guitar');
    });

    el('change-instrument-ukulele').addEventListener('click', e => {
      el('change-instrument-popup').style.display = 'none';
      const chordElement = element.getAttribute('data-chord');
      this.render(element, chordElement, 0, 'ukulele', options);
      this.onInstrumentChange &&
        this.onInstrumentChange.bind(this)(element, 'ukulele');
    });

    //On piano option selected
    el('change-instrument-piano').addEventListener('click', e => {
      el('change-instrument-popup').style.display = 'none';
      const chordElement = element.getAttribute('data-chord');
      this.render(element, chordElement, 0, 'piano', options);
      this.onInstrumentChange &&
        this.onInstrumentChange.bind(this)(element, 'piano');
    });

    el('play-sound').addEventListener('click', e => {
      if (!chord) return;
      let type = ['guitar', 'ukulele'].includes(instrument)
        ? 'acoustic'
        : 'piano';
      var musical = Synth.createInstrument(type);
      Synth.setVolume(0.3);
      if (type === 'acoustic') {
        const dataChord = chord.length
          ? chord[position].scheme
          : chord.value[position].scheme;
        for (var i = 0; i < 6; i++) {
          if (!['x', 'X'].includes(dataChord[i])) {
            var currentNote = this.upString(
              guitarString[i].startNote,
              dataChord[i],
              guitarString[i].order
            );
            this.playSingleNote(
              musical,
              currentNote.Note,
              currentNote.Order,
              0.7,
              200,
              i
            );
          }
        }
      } else {
        const note = splitWithDot(chord.note);
        let startOrder = 3;
        for (var i = 0; i < note.length; i++) {
          if (this.isHigherOrder(note[i - 1], note[i])) startOrder++;
          this.playSingleNote(
            musical,
            this.flatToSharp(note[i]),
            startOrder,
            1.7,
            200,
            i
          );
        }
      }
    });
  }
  isHigherOrder(prevKey, nextKey) {
    if (!prevKey || !nextKey) return false;
    let currentKey = prevKey;
    for (let i = 0; i <= 12; i++) {
      if (this.flatToSharp(currentKey) === this.flatToSharp(nextKey))
        return false;
      if (this.transposeUp_Half(currentKey) === 'C') return true;
      currentKey = this.transposeUp_Half(currentKey);
    }
    return false;
  }
  flatToSharp(key) {
    var flat = ['Db', 'Eb', 'Gb', 'Ab', 'Bb'];
    var sharp = ['C#', 'D#', 'F#', 'G#', 'A#'];
    if (flat.indexOf(key) != -1) {
      return sharp[flat.indexOf(key)];
    } else {
      return key;
    }
  }
  transposeUp_Half(key) {
    if (key[1] === 'b') {
      return key[0];
    }
    if (key[0] === 'E' && key.length == 1) {
      return 'F';
    }
    if (key[0] === 'B' && key.length == 1) {
      return 'C';
    }
    if (key[1] === '#') {
      if (key[0] === 'G') {
        return 'A';
      }
      return String.fromCharCode(key[0].charCodeAt(0) + 1);
    }
    return key + '#';
  }
  upString(start_Key, fr, order) {
    var new_Key = start_Key;
    var order_Up = 0;
    for (var i = 0; i < fr; i++) {
      new_Key = this.transposeUp_Half(new_Key);
      if (new_Key == 'C') {
        order_Up++;
      }
    }
    var x = {
      Note: new_Key,
      Order: ((fr / 12) | 0) + order + order_Up,
    };
    return x;
  }
  playSingleNote(instrument, note, orderNote, delay, timedelay, i) {
    setTimeout(function() {
      instrument.play(note, orderNote, delay);
    }, i * timedelay);
  }
  drawPianoFrame(ctx, endPosition) {
    ctx.beginPath();
    ctx.lineWidth = STROKE_WIDTH;

    //draw all white key
    for (let i = 0; i < endPosition + 1; i++) {
      ctx.moveTo(PIANO_LEFT_SPACE + i * PIANO_WHITE_KEY_WIDTH, TOP_SPACE);
      ctx.lineTo(
        PIANO_LEFT_SPACE + i * PIANO_WHITE_KEY_WIDTH,
        TOP_SPACE + PIANO_WHITE_KEY_HEIGHT
      );
    }
    //top line
    ctx.moveTo(PIANO_LEFT_SPACE, TOP_SPACE);
    ctx.lineTo(
      PIANO_LEFT_SPACE + PIANO_WHITE_KEY_WIDTH * endPosition,
      TOP_SPACE
    );

    //bottom line
    ctx.moveTo(PIANO_LEFT_SPACE, TOP_SPACE + PIANO_WHITE_KEY_HEIGHT);
    ctx.lineTo(
      PIANO_LEFT_SPACE + PIANO_WHITE_KEY_WIDTH * endPosition,
      TOP_SPACE + PIANO_WHITE_KEY_HEIGHT
    );
    ctx.stroke();
  }
  drawChordFrame(ctx, instrument) {
    const {
      MAX_FRETS,
      STRINGS_NUM,
      STRING_WIDTH,
      FRET_HEIGHT,
      CHORD_BOTTOM_OVERFLOW,
      FINGER_RADIUS,
    } = getConfigs(instrument);

    ctx.beginPath();
    ctx.lineWidth = STROKE_WIDTH;

    // Vertical bars
    for (let i = 0; i < MAX_FRETS + 1; i++) {
      ctx.moveTo(LEFT_SPACE, TOP_SPACE + (CHORD_HEIGHT * i) / MAX_FRETS);
      ctx.lineTo(LEFT_SPACE + CHORD_WIDTH, TOP_SPACE + (CHORD_HEIGHT * i) / 4);
    }

    // Horizontal bars
    for (let i = 0; i < STRINGS_NUM; i++) {
      ctx.moveTo(LEFT_SPACE + i * STRING_WIDTH, TOP_SPACE);
      ctx.lineTo(
        LEFT_SPACE + i * STRING_WIDTH,
        TOP_SPACE + CHORD_HEIGHT + CHORD_BOTTOM_OVERFLOW
      );
    }

    // Finish
    ctx.stroke();
  }
  drawText(ctx, content, startX, startY, textColor = 'white', fontSize = 50) {
    ctx.font = `600 ${
      content.length > 1 ? (fontSize * 4) / 5 : fontSize
    }px Arial`;
    ctx.fillStyle = textColor;
    ctx.fillText(content, startX, startY);
  }
  drawCircle(context, width, startX, startY, fillColor = 'black') {
    context.beginPath();
    context.arc(startX, startY, width / 8, 0, 2 * Math.PI);
    context.fillStyle = fillColor;
    context.fill();
  }
  drawPianoBlackKey(ctx, startNote, endPosition) {
    let is2BlackKeyFirst = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E'].includes(
      startNote
    );
    let flat = 0;

    ctx.lineWidth = PIANO_WHITE_KEY_WIDTH * 0.6;
    for (var i = 1; i < endPosition; i++) {
      if (
        (is2BlackKeyFirst && flat === 2) ||
        (!is2BlackKeyFirst && flat === 3)
      ) {
        flat = 0;
        is2BlackKeyFirst = !is2BlackKeyFirst;
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(PIANO_LEFT_SPACE + i * PIANO_WHITE_KEY_WIDTH, TOP_SPACE);
      ctx.lineTo(
        PIANO_LEFT_SPACE + i * PIANO_WHITE_KEY_WIDTH,
        TOP_SPACE + PIANO_WHITE_KEY_HEIGHT / 2
      );
      ctx.stroke();
      flat++;
    }
    // Finish
  }

  findWhiteKey(key, frame, min = 0) {
    if (key.includes('b') || key.includes('#')) return -1;
    let flat = 0;

    for (let i = 0; i < frame.length; i++) {
      if (typeof frame[i] === 'string') {
        if (key === frame[i] && flat >= min) {
          return flat;
        }
        flat++;
      }
    }

    return -1;
  }

  findBlackKey(key, frame, min = 0) {
    let flat = 0;
    for (let i = 0; i < frame.length; i++) {
      if (typeof frame[i] !== 'string') {
        if (frame[i].includes(key) && flat >= min) return flat;
        flat++;
      } else {
        if ((frame[i] === 'B' || frame[i] === 'E') && i + 1 < frame.length) {
          flat++;
        }
      }
    }
    return -1;
  }
  calculatePianoNote(note, startNote) {
    const startFrame = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E'].includes(
      startNote
    )
      ? PIANO_C
      : PIANO_F;
    const data = splitWithDot(note);
    const minDistance =
      startNote.includes('b') || startNote.includes('#')
        ? this.findBlackKey(startNote, startFrame, 0)
        : this.findWhiteKey(startNote, startFrame, 0);
    let currentWhiteKeyDistance = minDistance;
    let currentBlackKeyDistance = minDistance;
    let result = [];
    for (var i = 0; i < data.length; i++) {
      if (data[i].includes('b') || data[i].includes('#')) {
        let currentBlackKeyPosition = this.findBlackKey(
          data[i],
          startFrame,
          currentBlackKeyDistance
        );
        result.push({
          label: data[i],
          isBlack: true,
          position: currentBlackKeyPosition,
        });
        currentBlackKeyDistance = currentBlackKeyPosition;
      } else {
        let currentWhiteKeyPosition = this.findWhiteKey(
          data[i],
          startFrame,
          currentWhiteKeyDistance
        );
        result.push({
          label: data[i],
          isBlack: false,
          position: currentWhiteKeyPosition,
        });
        currentWhiteKeyDistance = currentWhiteKeyPosition;
      }
    }
    let endPosition = PIANO_WHITE_KEY_NUM;
    const processedFrame = startFrame.filter(x => typeof x === 'string');
    for (
      let i = Math.max(currentWhiteKeyDistance, currentBlackKeyDistance);
      i < processedFrame.length;
      i++
    ) {
      if (['B', 'E'].includes(processedFrame[i]) && i >= 6) {
        endPosition = i;
        break;
      }
    }
    return { frame: startFrame, result, endPosition: endPosition + 1 };
  }
  drawPianoMainKey(ctx, data) {
    //console.log(startNote);
    for (var i = 0; i < data.result.length; i++) {
      let width = PIANO_WHITE_KEY_WIDTH * 3.5;
      //draw black key
      if (data.result[i].isBlack) {
        let x =
          PIANO_LEFT_SPACE +
          PIANO_WHITE_KEY_WIDTH +
          data.result[i].position * PIANO_WHITE_KEY_WIDTH;
        let y = TOP_SPACE + PIANO_WHITE_KEY_HEIGHT / 3;
        this.drawCircle(ctx, width, x, y, '#e25241');
        this.drawText(ctx, data.result[i].label, x - 25, y + 15);
      }
      //draw white key
      else {
        let x =
          PIANO_LEFT_SPACE +
          PIANO_WHITE_KEY_WIDTH / 2 +
          data.result[i].position * PIANO_WHITE_KEY_WIDTH;
        let y = TOP_SPACE + (PIANO_WHITE_KEY_HEIGHT * 3) / 4;
        this.drawCircle(ctx, width, x, y, '#e25241');
        this.drawText(ctx, data.result[i].label, x - 17, y + 15);
      }
    }
  }
  drawFingers(ctx, data, position, instrument) {
    if (!data) {
      return false;
    }

    const {
      MAX_FRETS,
      STRINGS_NUM,
      STRING_WIDTH,
      FRET_HEIGHT,
      CHORD_BOTTOM_OVERFLOW,
      FINGER_RADIUS,
    } = getConfigs(instrument);

    if (!data[position]) return false;

    const scheme = data[position].scheme;
    const fingers = data[position].fingers;
    let fretOffset;

    const positions = scheme
      .filter(s => s.toLowerCase() !== 'x')
      .map(_ => Number(_))
      .map(_ => (_ === 0 ? 1 : _));

    const min = Math.min.apply(Math, positions);
    const max = Math.max.apply(Math, positions);

    if (instrument === 'ukulele') {
      fretOffset = 1;
    } else {
      fretOffset = min;
    }

    if (max > MAX_FRETS) {
      fretOffset = max - MAX_FRETS + 1;
    }

    if (fretOffset === 1) {
      // Draw the zero fret
      ctx.beginPath();
      ctx.moveTo(LEFT_SPACE, TOP_SPACE);
      ctx.lineWidth = STROKE_WIDTH * 3;
      ctx.lineTo(LEFT_SPACE + CHORD_WIDTH, TOP_SPACE);
      ctx.stroke();
    }

    // Draw scheme & finger number
    for (let i = 0; i < STRINGS_NUM; i++) {
      const fret = scheme[i] || 'x';
      if (fret.toLowerCase() === 'x') {
        ctx.beginPath();
        ctx.font = `${FONT_SIZE}pt Arial`;
        ctx.fillStyle = 'black';
        ctx.fillText(
          'X',
          LEFT_SPACE + i * STRING_WIDTH - FONT_SIZE / 2,
          TOP_SPACE - FINGER_RADIUS
        );
      } else if (+fret === 0) {
        ctx.beginPath();
        ctx.font = `${FONT_SIZE}pt Arial`;
        ctx.fillStyle = 'black';
        ctx.fillText(
          'o',
          LEFT_SPACE + i * STRING_WIDTH - FONT_SIZE / 2,
          TOP_SPACE - FINGER_RADIUS
        );
      } else {
        const numFret = +fret - fretOffset + 1;
        ctx.beginPath();
        ctx.fillStyle = 'black';
        ctx.lineWidth = 1;
        ctx.arc(
          LEFT_SPACE + i * STRING_WIDTH,
          TOP_SPACE + numFret * FRET_HEIGHT - FRET_HEIGHT / 2,
          FINGER_RADIUS,
          0,
          2 * Math.PI
        );
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'white';
        ctx.font = `${FONT_SIZE}pt Arial`;
        ctx.fillText(
          fingers[i] || '', // Some chord has no finger data
          LEFT_SPACE + i * STRING_WIDTH - FONT_SIZE / 3,
          TOP_SPACE + numFret * FRET_HEIGHT - FRET_HEIGHT / 2 + FONT_SIZE / 2
        );
      }
    }

    // Draw frets text
    for (let i = 1; i <= MAX_FRETS; i++) {
      ctx.beginPath();
      ctx.fillStyle = 'black';
      ctx.font = `${FONT_SIZE}pt Arial`;
      ctx.fillText(
        fretOffset + i - 1 + 'fr',
        LEFT_SPACE + CHORD_WIDTH + FONT_SIZE * 1.3,
        TOP_SPACE + i * FRET_HEIGHT - FRET_HEIGHT / 2 + FONT_SIZE / 2
      );
    }
    return true;
  }

  draw(ctx, data, position, instrument) {
    if (instrument === 'piano') {
      if (!data.note) return false;
      const startNote = splitWithDot(data.note)[0];
      this.drawPianoFrame(ctx, data.processedData.endPosition);
      this.drawPianoBlackKey(ctx, startNote, data.processedData.endPosition);
      this.drawPianoMainKey(ctx, data.processedData);
      return true;
    } else {
      //console.log(data);
      let _data = data;
      if (data.value) _data = data.value;
      this.drawChordFrame(ctx, instrument);
      return this.drawFingers(ctx, _data, position, instrument);
    }
  }
}

window.ChordJS = new ChordJS();