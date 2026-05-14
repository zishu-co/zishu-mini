// @ts-nocheck
// services/voice/recorder.ts
// 录音封装（RecorderManager）

export class Recorder {
  private manager: wx.RecorderManager;
  private tempFilePath: string = '';

  constructor() {
    this.manager = wx.getRecorderManager();
    this.manager.onStop((res) => {
      this.tempFilePath = res.tempFilePath;
    });
    this.manager.onError((err) => {
      console.error('[Recorder] 录音错误:', err);
    });
  }

  start() {
    this.tempFilePath = '';
    this.manager.start({
      duration: 60000,      // 最多60秒
      sampleRate: 16000,    // 16kHz（适合语音识别）
      numberOfChannels: 1,
      encodeBitRate: 48000,
      format: 'aac',
    });
  }

  stop(): string {
    this.manager.stop();
    return this.tempFilePath;
  }

  cancel() {
    this.manager.stop();
    this.tempFilePath = '';
  }

  getTempFilePath(): string {
    return this.tempFilePath;
  }
}
