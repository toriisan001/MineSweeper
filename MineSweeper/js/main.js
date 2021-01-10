'use strict';
{
    class Panel {
        constructor(game, num) {
            this.game = game;
            this.el = document.createElement('li');
            this.el.classList.add('pressed');
            // 座標を設定
            let i = Math.floor(num / this.game.getYPanelCount());
            let j = num % this.game.getYPanelCount();
            let coordinate = i + '-' + j;
            let coordinateX = i;
            let coordinateY = j; 
            this.el.dataset.cdX = coordinateX;
            this.el.dataset.cdY = coordinateY;
            this.el.setAttribute("id", coordinate);
        }
        getEl() {
            return this.el;
        }
        activate() {
            // テキストを初期化
            this.el.textContent = '';
            // クラスリストを空に設定
            this.el.classList.value = '';
            // 未選択の状態に設定
            this.el.classList.remove('pressed');
        }
    }

    class Board {
        constructor (game) {
            this.game = game;
            this.panels = [];
            this.selectPanel;
            this.setBomList;
            this.setBomMap;
            this.click;
            this.openPanel;
            for (let i = 0; i < (this.game.getXPanelCount() * this.game.getYPanelCount()); i++) {
                this.panels.push(new Panel(game, i));
            }
            this.setup();
        }

         setup () {
             const board = document.getElementById('board');
             const container = document.getElementById('container');
             // コンテナの横幅の長さを設定
             container.style.width = (this.game.getYPanelCount() * 40 + 20) + 'px';
             // ボードにパネルを設定
             this.panels.forEach(panel => {

                // ボードににパネルを追加
                 board.appendChild(panel.getEl());

                 // パネルにクリックイベントを追加
                 panel.el.addEventListener("click", (e) => {
                    // 共通処理
                    // 選択したパネルと座標を設定
                    this.selectPanel = panel;
                    this.selectPanelCdX = panel.el.dataset.cdX;
                    this.selectPanelCdY = panel.el.dataset.cdY;
                    this.selectPanelCoordinate = this.selectPanelCdX + '-' + this.selectPanelCdY;
                    var str = "";
                    // 押しているボタンに応じて処理を切り替える
                    switch (e.buttons) {
                        case 0 :
                            if (this.selectPanel.el.classList.contains('flag')) {
                                return;
                            }
                            // 左クリック選択時
                            this.leftClickEvent();
                            break;
                        case 2 :
                            // 同時押し選択時
                            this.rightClickEvent();
                            break;
                    }
                    // クリアチェック
                    this.clearCheck();
                });

                // エレメントをクリックした際に呼ばれる処理
                panel.el.addEventListener("mousedown", (e) => {
                    // 選択したパネルと座標を設定
                    this.selectPanel = panel;
                    this.selectPanelCdX = panel.el.dataset.cdX;
                    this.selectPanelCdY = panel.el.dataset.cdY;
                    this.selectPanelCoordinate = this.selectPanelCdX + '-' + this.selectPanelCdY;
                    var str = "";
                    // 押しているボタンに応じて処理を切り替える
                    switch (e.buttons) {
                        case 2 :
                            // 右クリック選択時
                            this.rightClickEvent();
                            break;
                    }
                });

                // コンテキストメニューを表示するイベント時のコールバック
                panel.el.addEventListener("contextmenu", function(e) {
                // デフォルトイベントをキャンセル
                e.preventDefault();
                }, false);

             });
        }

        active() {
            const resetBtn = document.getElementById('resetBtn');
            const bomCount = document.getElementById('bomCount');
            // リセットボタン選択時の初期化変数
            this.click = 0;
            this.openPanel = 0;
            this.setBomList = [];
            this.setBomMap = {};
            // タイマーを初期化
            timer.textContent = '000';
            // リセットボタンに画像を設定
            resetBtn.src = 'img/reset.png';
            // ボムカウントを設定
            bomCount.dataset.bomCount = this.game.getBomNum();
            bomCount.textContent = (this.game.getNumberFormat() + this.game.getBomNum()).slice(-this.game.getNumberFormat().length);
            // パネルを全てactivate化
            this.panels.forEach(panel => {
                panel.activate();

            });
        }

        clearCheck() {
            // ゲームオーバーフラグがOFFの状態でパネルを開いた数が(全パネル - ボム数)になったらクリア
            if(this.game.getGameover() === false && this.openPanel === ((this.game.getXPanelCount() * this.game.getYPanelCount()) - this.game.getBomNum())){
                const resetBtn = document.getElementById('resetBtn');
                // リセットボタンに画像を設定
               resetBtn.src = 'img/clear.png';
               // タイマーをストップさせる
               clearTimeout(this.game.getTimeoutId());
            };
        }

        rightClickEvent() {
            // 実行済みでなければフラッグを立てる
            if (!this.selectPanel.el.classList.contains('pressed')) {
                const bomCount = document.getElementById('bomCount');
                let bomNum = bomCount.dataset.bomCount;

                if (!this.selectPanel.el.classList.contains('flag')) {
                    bomNum--;
                    this.fillInPanel(this.selectPanelCoordinate, 'flag');
                } else {
                    bomNum++;
                    document.getElementById(this.selectPanelCoordinate).textContent = '';
                    document.getElementById(this.selectPanelCoordinate).classList.remove('flag');
                }

                bomCount.dataset.bomCount = bomNum;
                bomCount.textContent = (this.game.getNumberFormat() + bomNum).slice(-this.game.getNumberFormat().length)
            }
        }

        leftClickEvent() {
            this.click++;
            // 初回選択時はボムマップを作成
            if (this.click == 1) {
                this.setBom();
            }
            // パネルを選択状態に切り替え
            document.getElementById(this.selectPanelCoordinate).classList.add('pressed');
            if (this.setBomMap[this.selectPanelCoordinate]) {
                // ボムを起動
                this.fillInPanel(this.selectPanelCoordinate, 'bomb');
                // 残りのパネルを全て選択済みにする
                if (!this.game.getGameover()) {
                    this.bomClickAllSelect();
                }
            } else {
                // オープンパネルをインクリメント
                this.openPanel++;
                // 選択した周囲のパネルにボムがあれば数値を再帰的に記入
                this.recursionExe(this.selectPanelCdX, this.selectPanelCdY);
            }
        }

        bomClickAllSelect() {
            // ゲームオーバーフラグをONに設定
            this.game.setgameover(true);
            // タイマーをストップさせる
            clearTimeout(this.game.getTimeoutId());
            // 全てのパネルを選択済みにする
            for(let i = 0; i < this.game.getXPanelCount(); i++) {
                for(let j = 0; j < this.game.getYPanelCount(); j++) {
                    let targetCoordinate = i + '-' + j;
                    let target = document.getElementById(targetCoordinate);
                    // 実行済みでなければ実行
                    if (!target.classList.contains('pressed')) {
                        target.click();
                    }
                }
            }
        }

        recursionExe(cdX, cdY) {
            let x = parseInt(cdX, 10);
            let y = parseInt(cdY, 10);
            let bomCount = 0;
            let setClassMei = '';
            let coordinate = '';
            let exeList = [];
            // 左上のマスにボムがあるかを確認
            if (1 <= x && 1 <= y) {
                coordinate = (x - 1) + '-' + (y - 1);
                if (this.setBomMap[coordinate]) {
                    bomCount++;
                } else {
                    exeList.push(coordinate);
                }
            }
            // 上のマスにボムがあるかを確認
            if (1 <= x) {
                coordinate = (x - 1) + '-' + y;
                if (this.setBomMap[coordinate]) {
                    bomCount++;
                } else {
                    exeList.push(coordinate);
                }
            }
            // 右上のマスにボムがあるかを確認
            if (1 <= x && y < (this.game.getYPanelCount() - 1)) {
                coordinate = (x - 1) + '-' + (y + 1);
                if (this.setBomMap[coordinate]) {
                    bomCount++;
                } else {
                    exeList.push(coordinate);
                }
            }
            // 左のマスにボムがあるかを確認
            if (1 <= y) {
                coordinate = x + '-' + (y - 1);
                if (this.setBomMap[coordinate]) {
                    bomCount++;
                } else {
                    exeList.push(coordinate);
                }
            }
            // 右のマスにボムがあるかを確認
            if (y < (this.game.getYPanelCount() - 1)) {
                coordinate = x + '-' + (y + 1);
                if (this.setBomMap[coordinate]) {
                    bomCount++;
                } else {
                    exeList.push(coordinate);
                }
            }
            // 左下のマスにボムがあるかを確認
            if (x < (this.game.getXPanelCount() - 1) && 1 <= y) {
                coordinate = (x + 1) + '-' + (y - 1);
                if (this.setBomMap[coordinate]) {
                    bomCount++;
                } else {
                    exeList.push(coordinate);
                }
            }
            // 下のマスにボムがあるかを確認
            if (x < (this.game.getXPanelCount() - 1)) {
                coordinate = (x + 1) + '-' + y;
                if (this.setBomMap[coordinate]) {
                    bomCount++;
                } else {
                    exeList.push(coordinate);
                }
            }
            // 右下のマスにボムがあるかを確認
            if (x < (this.game.getXPanelCount() - 1) && y < (this.game.getYPanelCount() - 1)) {
                coordinate = (x + 1) + '-' + (y + 1);
                if (this.setBomMap[coordinate]) {
                    bomCount++;
                } else {
                    exeList.push(coordinate);
                }
            }
            if (bomCount == 0) {
                setClassMei = 'notBomb';
            } else {
                setClassMei = bomCount;
            }
            this.fillInPanel((cdX + '-' + cdY), setClassMei);

            // 周囲にボムが一つもなければ周囲のマスで再帰的に処理を実行する
            if (bomCount === 0) {
                exeList.forEach(exe => {
                    const target = document.getElementById(exe);
                    // 実行済みでなければ実行
                    if (!target.classList.contains('pressed')) {
                        target.click();
                        // Uncaught RangeError: Maximum call stack size exceeded.回避のために
                        // セットタイムアウトで処理を遅らせたが、遅かったので使わなかった
                        // setTimeout(function () {
                        //     target.click();
                        // }, 0);
                    }
                });
            }
        }

        // パネルとクラスに状態を記入
        fillInPanel(coordinate, classMei) {
            let fillInText = classMei;
            // マークに置き換え
            switch(fillInText) {
                case 'notBomb':
                    fillInText = '-'
                    break;
                case 'flag':
                    fillInText = '🚩'
                    break;
                case 'bomb':
                    fillInText = '💣'
                    break;
                default:
                    break;
            }
            // パネルに設定
            document.getElementById(coordinate).textContent = fillInText;
            // クラスを設定
            document.getElementById(coordinate).classList.add(classMei);
        }

        setBom () {
            // ランダムでボムを設定
            this.setBomList = this.addBomList(this.panels, this.game.getBomNum());
        }

        // ランダムで配列から選び出す
        addBomList(arrayData, count) {
            // countが設定されていない場合は1にする
            var count = count || 1;
            // 引数で渡されたデータを値コピー
            var arrayData = Array.from(arrayData);
            var result = [];
            // 選択されたパネルを削除して選択肢から外しておく
            for (var i = 0; i < arrayData.length; i++) {
                if (arrayData[i] == this.selectPanel) {
                    arrayData.splice(i, 1);
                }
            }
            // 引数の個数分のボムリストを作成
            for (var i = 0; i < count; i++) {
                var arrayIndex = Math.floor(Math.random() * arrayData.length);
                result[i] = arrayData[arrayIndex];
                let cdX = arrayData[arrayIndex].el.dataset.cdX;
                let cdY = arrayData[arrayIndex].el.dataset.cdY;
                this.setBomMap[cdX + '-' + cdY] = arrayData[arrayIndex];
                // 1回選択された値は削除して再度選ばれないようにする
                arrayData.splice(arrayIndex, 1);
            }
            return result;
        }
    }
    class Game {
        constructor() {
            // ゲーム中に使用する共通仕様
            this.bomNum = 60;
            this.xPanelCount = 15;
            this.yPanelCount = 30;
            this.numberFormat = '000';
            this.gameover = undefined;
            this.startTime = undefined;
            this.timeoutId = undefined;

            // Boardの初期化
            this.board =  new Board(this);
            const resetBtn = document.getElementById('resetBtn');
            // リセットボタン選択時のイベント
            resetBtn.addEventListener('click', () => {
                this.start();
            });
        }

        start() {
            if (typeof this.timeoutId !== 'undefined') {
                clearTimeout(this.timeoutId);
            }
            // ゲームオーバー変数をfalseで初期化
            this.gameover = false;
            // ボードの生成
            this.board.active();
            // スタートタイムの取得
            this.startTime = Date.now();
            // タイマーの作動
            this.runTimer();
        }

        runTimer() {
            const timer = document.getElementById('timer');
            timer.textContent = (this.numberFormat + (++timer.textContent)).slice(-this.numberFormat.length)
            this.timeoutId = setTimeout(() => {
                this.runTimer();
            }, 1000);
        }

        setgameover(setBoolean) {
            this.gameover = setBoolean;
        }

        getTimeoutId() {
            return this.timeoutId;
        }

        getBomNum() {
            return this.bomNum;
        }

        getXPanelCount() {
            return this.xPanelCount;
        }

        getYPanelCount() {
            return this.yPanelCount;
        }

        getNumberFormat() {
            return this.numberFormat;
        }

        getGameover() {
            return this.gameover;
        }
    }
    new Game();
}