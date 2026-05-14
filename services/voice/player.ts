// @ts-nocheck
// services/voice/player.ts
// 语音播放封装（InnerAudioContext）

export class Player {
  private audio: wx.InnerAudioContext;
  private isPlaying: boolean = false;

  constructor() {
    this.audio = wx.createInnerAudioContext();
    this.audio.onPlay(() => {
      this.isPlaying = true;
    });
    this.audio.onEnded(() => {
      this.isPlaying = false;
    });
    this.audio.onError((err) => {
      console.error('[Player] 播放错误:', err);
      this.isPlaying = false;
    });
  }

  play(url: string) {
    if (this.isPlaying) {
      this.stop();
    }
    this.audio.src = url;
    this.audio.play();
  }

  stop() {
    this.audio.stop();
    this.isPlaying = false;
  }

  pause() {
    this.audio.pause();
    this.isPlaying = false;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}
