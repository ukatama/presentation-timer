import React from 'react';

import {Dialog, FlatButton, Styles, TextField} from 'material-ui';

export const App = React.createClass({
    getInitialState: function () {
        const prev = localStorage.getItem('bell');
        return {
            openConfig: true,
            offset: 0,                                // タイマーのスタートボタンを押した時間
            t0: Date.now(),
            time: 0,
            running: false,
            dirty: false,
            bell: prev ? JSON.parse(prev) : [15, 18], // ベルを鳴らし始める時間 [1回目, 2回目] (デフォルト値 [15, 18])
            played: [],
        };
    },

    componentDidMount: function () {
        // 200ミリ秒毎にタイマーの状態を更新
        this.timer = setInterval(function () {
            if (this.state.running) {
                const time = Math.floor((Date.now() - this.state.t0) / 1000) + this.state.offset;

                const state = {
                    time: time
                };

                for (let i = 0; i < 2; i++) {
                    // 「i回目のベルがまだ鳴っていない && 現在の経過時間が指定した時間(分)と同じもしくは過ぎている」とき
                    // -> 指定した時間に初めてベルが鳴ったとき
                    if (!this.state.played[i] && time >= this.state.bell[i] * 60) {
                        // ベルを鳴らすプログラム
                        const played = this.state.played;
                        played[i] = true;
                        this.setState({
                            played: played,
                        });
                        this.bell(i + 1);
                        break;
                    }
                }

                this.setState(state);
            }
        }.bind(this), 200);
    },

    start: function () {
        this.setState({
            offset: this.state.time,
            t0: Date.now(),
            running: true,
            dirty: true,
        });
    },

    stop: function () {
        this.setState({
            running: false,
            dirty: true,
        });
    },

    config: function () {
        this.setState({
            openConfig: true,
        });
    },
    dismissConfig: function () {
        this.setState({
            openConfig: false,
        });
    },

    reset: function () {
        this.setState({
            offset: 0,
            t0: Date.now(),
            time: 0,
            running: false,
            dirty: false,
            played: [],
        });
    },

    bell: function (n) {
        this.ringBell();

        if (n > 1) {
            // 2連ベルの間隔は400ミリ秒
            setTimeout(function () {
                this.bell(n - 1);
            }.bind(this), 400);
        }
    },

    // ベルを鳴らす関数
    // 音量調整のためのボタンを追加するためにbell()からコードを分離
    ringBell: function () {
        const bell = document.createElement('audio');
        bell.src = 'bell.mp3';
        bell.preload = true;
        bell.play();
    },

    setBell: function (value, n) {
        const bell = this.state.bell;
        bell[+n] = +value || undefined;

        this.setState({bell: bell});

        localStorage.setItem('bell', JSON.stringify(bell));
    },

    setBell_1: function (e) {
        this.setBell(e.target.value, 1);
    },
    setBell_2: function (e) {
        this.setBell(e.target.value, 2);
    },

    render: function () {
        const time = this.state.time;

        // m: 分, s: 秒
        const m = Math.floor(time / 60);
        let s = time % 60;
        //if (m < 10) m = '0' + m; // e.g. 9分59秒 -> 09:59
        if (s < 10) s = '0' + s;

        const styles = {
            container: {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                color: 'white',
                transition: 'all ease-in-out 0.2s',
            },
            control: {
                padding: '8px',
                flex: '0 0 auto',
                textAlign: 'center',
            },
            bell: {
                textAlign: 'center',
            },
            timer: {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                //flex: '1 1 auto',
                textAlign: 'center',
                fontSize: Math.min(window.innerWidth / 6, window.innerHeight / 2) + 'pt',
            },
            button: {
                margin: '0 4px',
            },
            field: {
                display: 'block',
                width: '100%',
            },
        };

        const colors = [
            Styles.Colors.blue600,
            Styles.Colors.orange800,
            Styles.Colors.red800,
        ];

        // 経過時間によって背景色を変更
        styles.container.backgroundColor = colors[2];
        for (let i = 0; i < 2; i++) {
            if (m < this.state.bell[i]) {
                styles.container.backgroundColor = colors[i];
                break;
            }
        }

        const startstop = this.state.running
            ? <FlatButton style={styles.button} onTouchTap={this.stop}>stop</FlatButton>
            : <FlatButton style={styles.button} onTouchTap={this.start}>start</FlatButton>;
        
        const reset = (this.state.running || !this.state.dirty)
            ? undefined
            : <FlatButton style={styles.button} onTouchTap={this.reset}>reset</FlatButton>;

        const config = this.state.running
            ? undefined
            : <FlatButton style={styles.button} onTouchTap={this.config}>config</FlatButton>;

        // 音量調整用のベルボタン設置
        const ring = <FlatButton style={styles.button} onTouchTap={this.ringBell}>ring</FlatButton>;

        const fields = this.state.bell.map(function (value, i) {
            const handleChange = function (e) {
                this.setBell(e.target.value, i);
            }.bind(this);

            return (
                    <TextField 
                        key={i}
                        floatingLabelText={'Bell ' + (i + 1)}
                        value={value}
                        style={styles.field}
                        onChange={handleChange} />
                   );

        }, this);

        const bell = this.state.bell.map(function (bell) {
            return bell + 'm';
        }).join(' / ');

        return (
                <div style={{width: '100%', height: '100%'}}>
                    <Dialog
                        ref="config"
                        title="Config"
                        actions={[{text: 'OK', ref: 'OK', onTouchTap: this.dismissConfig}]}
                        actionFocus="OK"
                        open={this.state.openConfig} >
                        {fields}
                    </Dialog>
                    <div style={styles.container}>
                        <div style={styles.timer}>
                            {m + ':' + s}
                        </div>
                        <div style={styles.bell}>
                            {bell}
                        </div>
                        <div style={styles.control}>
                            {startstop} {reset} {config} {ring}
                        </div>
                    </div>
                </div>
               );
    }
});
