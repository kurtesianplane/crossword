(function () {
    'use strict';

    var ROWS = 6;
    var COLS = 5;

    var WORDS = [
        {
            num: 1,
            clue: 'Feline pet',
            answer: ['C', 'A', 'T'],
            cells: [[0, 0], [0, 1], [0, 2]],
            valentine: [
                { letter: 'C' },
                { letter: 'A' },
                { letter: 'N' }
            ]
        },
        {
            num: 2,
            clue: 'Organ of sight',
            answer: ['E', 'Y', 'E'],
            cells: [[1, 1], [1, 2], [1, 3]],
            valentine: [
                { letter: 'I' },
                { black: true },
                { black: true }
            ]
        },
        {
            num: 3,
            clue: 'Striped honey maker',
            answer: ['B', 'E', 'E'],
            cells: [[2, 2], [2, 3], [2, 4]],
            valentine: [
                { letter: 'B' },
                { letter: 'E' },
                { black: true }
            ]
        },
        {
            num: 4,
            clue: 'Number after three',
            answer: ['F', 'O', 'U', 'R'],
            cells: [[3, 1], [3, 2], [3, 3], [3, 4]],
            valentine: [
                { letter: 'Y' },
                { letter: 'O' },
                { letter: 'U' },
                { letter: 'R' }
            ]
        },
        {
            num: 5,
            clue: 'Battlefield courage',
            answer: ['V', 'A', 'L', 'O', 'R'],
            cells: [[4, 0], [4, 1], [4, 2], [4, 3], [4, 4]],
            valentine: [
                { letter: 'V' },
                { letter: 'A' },
                { letter: 'L' },
                { letter: 'E' },
                { letter: 'N' }
            ]
        },
        {
            num: 6,
            clue: 'What a clock tells',
            answer: ['T', 'I', 'M', 'E'],
            cells: [[5, 1], [5, 2], [5, 3], [5, 4]],
            valentine: [
                { letter: 'T' },
                { letter: 'I' },
                { letter: 'N' },
                { letter: 'E' }
            ]
        }
    ];

    var whiteCells = {};
    var cellWord = {};
    var cellNums = {};

    WORDS.forEach(function (w, wi) {
        w.cells.forEach(function (c, ci) {
            var key = c[0] + '-' + c[1];
            whiteCells[key] = true;
            cellWord[key] = { wordIdx: wi, pos: ci };
            if (ci === 0) cellNums[key] = w.num;
        });
    });

    var state = {
        grid: {},
        selCell: null,
        selWord: null,
        timerSec: 0,
        timerOn: false,
        timerRef: null,
        solved: false,
        revealed: false,
        paused: false
    };

    var els = {};

    function key(r, c) { return r + '-' + c; }

    function init() {
        cacheEls();
        buildGrid();
        buildClues();
        bindEvents();
        selectWord(0, true);
        startTimer();
    }

    function cacheEls() {
        els.grid = document.getElementById('grid');
        els.clueLabel = document.getElementById('clueLabel');
        els.clueText = document.getElementById('clueText');
        els.cluesList = document.getElementById('cluesList');
        els.timer = document.getElementById('timer');
        els.timerToggle = document.getElementById('timerToggle');
        els.pauseIcon = document.getElementById('pauseIcon');
        els.playIcon = document.getElementById('playIcon');
        els.btnClear = document.getElementById('btnClear');
        els.btnReveal = document.getElementById('btnReveal');
        els.btnCheck = document.getElementById('btnCheck');
        els.hiddenInput = document.getElementById('hiddenInput');
        els.overlay = document.getElementById('valentineOverlay');
        els.valentineYes = document.getElementById('valentineYes');
        els.valentineNo = document.getElementById('valentineNo');
        els.valentineStat = document.getElementById('valentineStat');
        els.headerTitle = document.querySelector('.header-title');
        els.heartsContainer = document.getElementById('heartsContainer');
        els.gridWrapper = document.getElementById('gridWrapper');
    }

    function buildGrid() {
        var entranceDelay = 0;
        for (var r = 0; r < ROWS; r++) {
            for (var c = 0; c < COLS; c++) {
                var k = key(r, c);
                var cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;

                if (!whiteCells[k]) {
                    cell.classList.add('black');
                } else {
                    var numEl = document.createElement('span');
                    numEl.className = 'cell-number';
                    if (cellNums[k]) numEl.textContent = cellNums[k];
                    cell.appendChild(numEl);

                    var letEl = document.createElement('span');
                    letEl.className = 'cell-letter';
                    cell.appendChild(letEl);

                    cell.classList.add('entering');
                    cell.style.animationDelay = entranceDelay + 'ms';
                    entranceDelay += 25;

                    (function (row, col) {
                        cell.addEventListener('click', function () {
                            onCellClick(row, col);
                        });
                    })(r, c);
                }

                els.grid.appendChild(cell);
                els['cell_' + k] = cell;
            }
        }
    }

    function buildClues() {
        WORDS.forEach(function (w, i) {
            var li = document.createElement('li');
            li.className = 'clue-item';

            var numSpan = document.createElement('span');
            numSpan.className = 'clue-num';
            numSpan.textContent = w.num;

            var textSpan = document.createElement('span');
            textSpan.className = 'clue-text-side';
            textSpan.textContent = w.clue;

            li.appendChild(numSpan);
            li.appendChild(textSpan);

            li.addEventListener('click', function () {
                selectWord(i, true);
                focusInput();
            });

            els.cluesList.appendChild(li);
            els['clueItem_' + i] = li;
        });
    }

    function bindEvents() {
        document.addEventListener('keydown', onKeyDown);

        els.hiddenInput.addEventListener('input', function (e) {
            var val = e.data;
            if (val && /^[a-zA-Z]$/.test(val)) {
                enterLetter(val.toUpperCase());
            }
            els.hiddenInput.value = '';
        });

        els.timerToggle.addEventListener('click', togglePause);
        els.btnClear.addEventListener('click', onClear);
        els.btnReveal.addEventListener('click', onReveal);
        els.btnCheck.addEventListener('click', onCheck);
        els.valentineYes.addEventListener('click', onYes);
        els.valentineNo.addEventListener('click', onNo);
    }

    function focusInput() {
        els.hiddenInput.focus({ preventScroll: true });
    }

    /* ─── Selection ─────────────────────────────── */

    function onCellClick(r, c) {
        if (state.solved || state.paused) return;
        var k = key(r, c);
        var info = cellWord[k];
        if (!info) return;

        if (state.selCell && state.selCell[0] === r && state.selCell[1] === c && state.selWord === info.wordIdx) {
            selectWord(info.wordIdx, true);
        } else {
            state.selWord = info.wordIdx;
            state.selCell = [r, c];
            renderSelection();
        }
        focusInput();
    }

    function selectWord(wi, selectFirst) {
        state.selWord = wi;
        var w = WORDS[wi];
        if (selectFirst) {
            var firstEmpty = null;
            for (var i = 0; i < w.cells.length; i++) {
                var k = key(w.cells[i][0], w.cells[i][1]);
                if (!state.grid[k]) { firstEmpty = i; break; }
            }
            var idx = firstEmpty !== null ? firstEmpty : 0;
            state.selCell = [w.cells[idx][0], w.cells[idx][1]];
        }
        renderSelection();
    }

    function renderSelection() {
        document.querySelectorAll('.cell.selected, .cell.highlighted').forEach(function (c) {
            c.classList.remove('selected', 'highlighted');
        });
        document.querySelectorAll('.clue-item.active').forEach(function (c) {
            c.classList.remove('active');
        });

        if (state.selWord === null) return;

        var w = WORDS[state.selWord];
        w.cells.forEach(function (c) {
            var el = els['cell_' + key(c[0], c[1])];
            if (el) el.classList.add('highlighted');
        });

        if (state.selCell) {
            var sel = els['cell_' + key(state.selCell[0], state.selCell[1])];
            if (sel) {
                sel.classList.remove('highlighted');
                sel.classList.add('selected');
            }
        }

        var clueItem = els['clueItem_' + state.selWord];
        if (clueItem) {
            clueItem.classList.add('active');
            clueItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }

        els.clueLabel.textContent = w.num + 'A';
        els.clueText.textContent = w.clue;
    }

    /* ─── Input ─────────────────────────────────── */

    function onKeyDown(e) {
        if (state.solved && state.revealed) return;
        if (state.paused) return;
        if (state.selWord === null) return;

        var handled = false;

        if (/^[a-zA-Z]$/.test(e.key)) {
            enterLetter(e.key.toUpperCase());
            handled = true;
        } else if (e.key === 'Backspace') {
            deleteLetter();
            handled = true;
        } else if (e.key === 'Delete') {
            clearCurrentCell();
            handled = true;
        } else if (e.key === 'Tab') {
            e.preventDefault();
            var dir = e.shiftKey ? -1 : 1;
            var next = ((state.selWord + dir) % WORDS.length + WORDS.length) % WORDS.length;
            selectWord(next, true);
            focusInput();
            handled = true;
        } else if (e.key === 'ArrowRight') {
            moveInWord(1);
            handled = true;
        } else if (e.key === 'ArrowLeft') {
            moveInWord(-1);
            handled = true;
        } else if (e.key === 'ArrowDown') {
            var nextW = Math.min(state.selWord + 1, WORDS.length - 1);
            selectWord(nextW, true);
            handled = true;
        } else if (e.key === 'ArrowUp') {
            var prevW = Math.max(state.selWord - 1, 0);
            selectWord(prevW, true);
            handled = true;
        }

        if (handled) e.preventDefault();
    }

    function enterLetter(ch) {
        if (!state.selCell) return;
        var k = key(state.selCell[0], state.selCell[1]);
        state.grid[k] = ch;

        var cell = els['cell_' + k];
        var letEl = cell.querySelector('.cell-letter');
        letEl.textContent = ch;

        cell.classList.remove('letter-pop');
        void cell.offsetWidth;
        cell.classList.add('letter-pop');

        advanceCursor();
        checkWordComplete();
        checkPuzzleComplete();
    }

    function deleteLetter() {
        if (!state.selCell) return;
        var k = key(state.selCell[0], state.selCell[1]);

        if (state.grid[k]) {
            state.grid[k] = '';
            var cell = els['cell_' + k];
            cell.querySelector('.cell-letter').textContent = '';
        } else {
            retreatCursor();
            var k2 = key(state.selCell[0], state.selCell[1]);
            state.grid[k2] = '';
            var cell2 = els['cell_' + k2];
            cell2.querySelector('.cell-letter').textContent = '';
        }
        renderSelection();
    }

    function clearCurrentCell() {
        if (!state.selCell) return;
        var k = key(state.selCell[0], state.selCell[1]);
        state.grid[k] = '';
        var cell = els['cell_' + k];
        cell.querySelector('.cell-letter').textContent = '';
    }

    function advanceCursor() {
        var w = WORDS[state.selWord];
        var pos = getCursorPos();
        if (pos < w.cells.length - 1) {
            var next = w.cells[pos + 1];
            state.selCell = [next[0], next[1]];
        } else {
            var allFilled = true;
            for (var i = 0; i < w.cells.length; i++) {
                if (!state.grid[key(w.cells[i][0], w.cells[i][1])]) {
                    allFilled = false;
                    state.selCell = [w.cells[i][0], w.cells[i][1]];
                    break;
                }
            }
        }
        renderSelection();
    }

    function retreatCursor() {
        var w = WORDS[state.selWord];
        var pos = getCursorPos();
        if (pos > 0) {
            var prev = w.cells[pos - 1];
            state.selCell = [prev[0], prev[1]];
        }
    }

    function moveInWord(dir) {
        var w = WORDS[state.selWord];
        var pos = getCursorPos();
        var np = pos + dir;
        if (np >= 0 && np < w.cells.length) {
            state.selCell = [w.cells[np][0], w.cells[np][1]];
            renderSelection();
        }
    }

    function getCursorPos() {
        var w = WORDS[state.selWord];
        for (var i = 0; i < w.cells.length; i++) {
            if (w.cells[i][0] === state.selCell[0] && w.cells[i][1] === state.selCell[1]) return i;
        }
        return 0;
    }

    /* ─── Completion ────────────────────────────── */

    function checkWordComplete() {
        var w = WORDS[state.selWord];
        var complete = true;
        var correct = true;
        for (var i = 0; i < w.cells.length; i++) {
            var k = key(w.cells[i][0], w.cells[i][1]);
            if (!state.grid[k]) { complete = false; correct = false; break; }
            if (state.grid[k] !== w.answer[i]) correct = false;
        }
        var ci = els['clueItem_' + state.selWord];
        if (correct && complete) {
            ci.classList.add('completed');
        } else {
            ci.classList.remove('completed');
        }
    }

    function checkPuzzleComplete() {
        for (var wi = 0; wi < WORDS.length; wi++) {
            var w = WORDS[wi];
            for (var i = 0; i < w.cells.length; i++) {
                var k = key(w.cells[i][0], w.cells[i][1]);
                if (state.grid[k] !== w.answer[i]) return;
            }
        }
        onPuzzleSolved();
    }

    function onPuzzleSolved() {
        if (state.solved) return;
        state.solved = true;
        stopTimer();

        var sec = state.timerSec;
        var statText;
        if (sec < 60) {
            statText = 'Congratulations! You solved The Mini in ' + sec + ' second' + (sec !== 1 ? 's' : '') + '.';
        } else {
            var m = Math.floor(sec / 60);
            var s = sec % 60;
            statText = 'Congratulations! You solved The Mini in ' + m + ' minute' + (m !== 1 ? 's' : '');
            if (s > 0) statText += ' and ' + s + ' second' + (s !== 1 ? 's' : '');
            statText += '.';
        }
        els.valentineStat.textContent = statText;

        document.querySelectorAll('.cell.selected, .cell.highlighted').forEach(function (c) {
            c.classList.remove('selected', 'highlighted');
        });

        setTimeout(function () {
            playValentineReveal();
        }, 600);
    }

    /* ─── Timer ─────────────────────────────────── */

    function startTimer() {
        state.timerOn = true;
        state.timerRef = setInterval(function () {
            if (!state.timerOn) return;
            state.timerSec++;
            renderTimer();
        }, 1000);
    }

    function stopTimer() {
        state.timerOn = false;
        if (state.timerRef) clearInterval(state.timerRef);
    }

    function renderTimer() {
        var m = Math.floor(state.timerSec / 60);
        var s = state.timerSec % 60;
        els.timer.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    }

    function togglePause() {
        if (state.solved) return;
        state.paused = !state.paused;
        state.timerOn = !state.paused;

        els.pauseIcon.style.display = state.paused ? 'none' : '';
        els.playIcon.style.display = state.paused ? '' : 'none';

        var existing = els.gridWrapper.querySelector('.pause-overlay');
        if (state.paused) {
            var overlay = document.createElement('div');
            overlay.className = 'pause-overlay';
            overlay.innerHTML = '<span>PAUSED</span>';
            overlay.addEventListener('click', togglePause);
            els.gridWrapper.appendChild(overlay);
        } else if (existing) {
            existing.remove();
        }
    }

    /* ─── Tool Buttons ──────────────────────────── */

    function onClear() {
        if (state.solved) return;
        if (state.selWord !== null) {
            var w = WORDS[state.selWord];
            w.cells.forEach(function (c) {
                var k = key(c[0], c[1]);
                state.grid[k] = '';
                els['cell_' + k].querySelector('.cell-letter').textContent = '';
            });
            var ci = els['clueItem_' + state.selWord];
            ci.classList.remove('completed');
            selectWord(state.selWord, true);
        }
    }

    function onReveal() {
        if (state.solved) return;
        if (state.selWord !== null) {
            var w = WORDS[state.selWord];
            w.cells.forEach(function (c, i) {
                var k = key(c[0], c[1]);
                state.grid[k] = w.answer[i];
                var cell = els['cell_' + k];
                var letEl = cell.querySelector('.cell-letter');
                setTimeout(function () {
                    letEl.textContent = w.answer[i];
                    cell.classList.remove('letter-pop');
                    void cell.offsetWidth;
                    cell.classList.add('letter-pop');
                }, i * 80);
            });
            setTimeout(function () {
                checkWordComplete();
                checkPuzzleComplete();
            }, w.cells.length * 80 + 50);
        }
    }

    function onCheck() {
        if (state.solved) return;
        if (state.selWord !== null) {
            var w = WORDS[state.selWord];
            w.cells.forEach(function (c, i) {
                var k = key(c[0], c[1]);
                var cell = els['cell_' + k];
                if (!state.grid[k]) return;
                if (state.grid[k] !== w.answer[i]) {
                    cell.classList.add('incorrect');
                    setTimeout(function () {
                        cell.classList.remove('incorrect');
                    }, 600);
                } else {
                    cell.classList.add('correct-flash');
                    setTimeout(function () {
                        cell.classList.remove('correct-flash');
                    }, 600);
                }
            });
        }
    }

    /* ─── Valentine Reveal ──────────────────────── */

    function playValentineReveal() {
        state.revealed = true;
        var allTransforms = [];
        var delay = 0;

        WORDS.forEach(function (w) {
            w.cells.forEach(function (c, i) {
                allTransforms.push({
                    cell: c,
                    valentine: w.valentine[i],
                    delay: delay
                });
                delay += 90;
            });
            delay += 180;
        });

        allTransforms.forEach(function (t) {
            transformCell(t.cell, t.valentine, t.delay);
        });

        var totalFlipTime = delay + 400;

        setTimeout(function () {
            highlightWordsSequence();
        }, totalFlipTime);

        setTimeout(function () {
            startHearts();
        }, totalFlipTime + 1400);

        setTimeout(function () {
            els.overlay.classList.add('active');
        }, totalFlipTime + 1800);
    }

    function transformCell(cellCoord, valentine, delay) {
        var k = key(cellCoord[0], cellCoord[1]);
        var cell = els['cell_' + k];
        if (!cell) return;

        setTimeout(function () {
            cell.classList.add('flip-out');

            setTimeout(function () {
                cell.classList.remove('flip-out', 'selected', 'highlighted');

                if (valentine.black) {
                    cell.classList.add('valentine-black');
                    var letEl = cell.querySelector('.cell-letter');
                    if (letEl) letEl.textContent = '';
                    var numEl = cell.querySelector('.cell-number');
                    if (numEl) numEl.textContent = '';
                } else {
                    cell.classList.add('valentine-cell');
                    var letEl = cell.querySelector('.cell-letter');
                    if (letEl) letEl.textContent = valentine.letter;
                    var numEl = cell.querySelector('.cell-number');
                    if (numEl) numEl.textContent = '';
                }

                cell.classList.add('flip-in');
                setTimeout(function () {
                    cell.classList.remove('flip-in');
                }, 300);
            }, 280);
        }, delay);
    }

    function highlightWordsSequence() {
        var groups = [
            { cells: WORDS[0].cells, delay: 0, duration: 500 },
            { cells: WORDS[1].cells.slice(0, 1), delay: 600, duration: 400 },
            { cells: WORDS[2].cells.slice(0, 2), delay: 1100, duration: 450 },
            { cells: WORDS[3].cells, delay: 1650, duration: 500 },
            { cells: WORDS[4].cells.concat(WORDS[5].cells), delay: 2250, duration: 700 }
        ];

        groups.forEach(function (g) {
            setTimeout(function () {
                g.cells.forEach(function (c) {
                    var k = key(c[0], c[1]);
                    var cell = els['cell_' + k];
                    if (cell && !cell.classList.contains('valentine-black')) {
                        cell.classList.add('valentine-glow');
                    }
                });
                setTimeout(function () {
                    g.cells.forEach(function (c) {
                        var k = key(c[0], c[1]);
                        var cell = els['cell_' + k];
                        if (cell) cell.classList.remove('valentine-glow');
                    });
                }, g.duration);
            }, g.delay);
        });
    }

    /* ─── Hearts ────────────────────────────────── */

    function startHearts() {
        var heartChars = ['❤️', '💕', '💖', '💗', '💝', '♥', '🌸', '🩷'];
        var count = 35;
        for (var i = 0; i < count; i++) {
            (function (idx) {
                setTimeout(function () {
                    spawnHeart(heartChars[idx % heartChars.length]);
                }, idx * 180);
            })(i);
        }
    }

    function spawnHeart(ch) {
        var heart = document.createElement('div');
        heart.className = 'floating-heart';
        heart.textContent = ch;
        var x = 5 + Math.random() * 90;
        var size = 16 + Math.random() * 26;
        var duration = 3.5 + Math.random() * 3.5;
        var drift = (Math.random() - 0.5) * 120;
        var spin = (Math.random() - 0.5) * 720;

        heart.style.left = x + 'vw';
        heart.style.fontSize = size + 'px';
        heart.style.animationDuration = duration + 's';
        heart.style.setProperty('--drift', drift + 'px');
        heart.style.setProperty('--spin', spin + 'deg');

        els.heartsContainer.appendChild(heart);
        setTimeout(function () {
            if (heart.parentNode) heart.remove();
        }, duration * 1000 + 200);
    }

    /* ─── Overlay ───────────────────────────────── */

    function onYes() {
        els.overlay.classList.remove('active');
        els.headerTitle.textContent = 'see u on wednesday :)';
        els.headerTitle.classList.add('accepted');
        document.querySelectorAll('.cell.valentine-cell').forEach(function (c) {
            c.classList.add('valentine-glow');
        });
    }

    function onNo() {
        els.overlay.classList.remove('active');
        resetPuzzle();
    }

    function resetPuzzle() {
        state.grid = {};
        state.selCell = null;
        state.selWord = null;
        state.timerSec = 0;
        state.timerOn = false;
        state.solved = false;
        state.revealed = false;
        state.paused = false;
        if (state.timerRef) clearInterval(state.timerRef);
        renderTimer();

        els.heartsContainer.innerHTML = '';

        var pause = els.gridWrapper.querySelector('.pause-overlay');
        if (pause) pause.remove();
        els.pauseIcon.style.display = '';
        els.playIcon.style.display = 'none';

        for (var r = 0; r < ROWS; r++) {
            for (var c = 0; c < COLS; c++) {
                var k = key(r, c);
                var cell = els['cell_' + k];
                if (!cell) continue;

                cell.classList.remove(
                    'valentine-cell', 'valentine-black', 'valentine-glow',
                    'flip-in', 'flip-out', 'selected', 'highlighted',
                    'incorrect', 'correct-flash', 'letter-pop'
                );

                if (!whiteCells[k]) {
                    cell.className = 'cell black';
                } else {
                    cell.className = 'cell';
                    var numEl = cell.querySelector('.cell-number');
                    if (numEl) {
                        numEl.style.opacity = '';
                        numEl.textContent = cellNums[k] || '';
                    }
                    var letEl = cell.querySelector('.cell-letter');
                    if (letEl) letEl.textContent = '';
                }
            }
        }

        document.querySelectorAll('.clue-item.completed').forEach(function (c) {
            c.classList.remove('completed');
        });

        selectWord(0, true);
        startTimer();
        focusInput();
    }

    /* ─── Boot ──────────────────────────────────── */

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
