/**
 * ============================================================================
 * Web Audio API 기반 힐링 화이트 노이즈 사운드 엔진 (sound-generator.js)
 * ============================================================================
 * 역할:
 * 1. 대용량 MP3 파일 다운로드 없이, 브라우저 Web Audio API로 실시간 노이즈 합성
 * 2. 빗소리(Rain), 백색소음(White Noise), 브라운소음(Deep Waves), 모닥불(Fireplace) 재생
 * 3. 볼륨 조절 및 부드러운 페이드 인/아웃 지원
 */

const SoundEngine = {
  audioCtx: null,
  currentType: null,
  isPlaying: false,
  gainNode: null,
  sourceNode: null,
  noiseBuffer: null,

  initContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = 0.3; // 기본 볼륨 30%
      this.gainNode.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  },

  /**
   * 백색/브라운/핑크 노이즈 오디오 버퍼 생성
   */
  createNoiseBuffer(type) {
    if (!this.audioCtx) return null;
    const bufferSize = this.audioCtx.sampleRate * 2; // 2초 분량 버퍼 루프
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;

      if (type === 'white') {
        data[i] = white * 0.15;
      } else if (type === 'brown' || type === 'waves') {
        // 브라운 노이즈 (깊은 파도 소리/폭포)
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 1.5;
      } else if (type === 'rain') {
        // 핑크 노이즈 필터링 (잔잔한 빗소리)
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      } else {
        data[i] = white * 0.1;
      }
    }
    return buffer;
  },

  /**
   * 사운드 재생
   * @param {'rain' | 'waves' | 'white'} type - 노이즈 종류
   */
  play(type) {
    this.initContext();
    this.stop(); // 기존 재생 중지

    const buffer = this.createNoiseBuffer(type);
    if (!buffer) return;

    this.sourceNode = this.audioCtx.createBufferSource();
    this.sourceNode.buffer = buffer;
    this.sourceNode.loop = true;

    // 필터 연결로 음색 더욱 부드럽게 조정
    const filter = this.audioCtx.createBiquadFilter();
    if (type === 'rain') {
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
    } else if (type === 'waves') {
      filter.type = 'lowpass';
      filter.frequency.value = 600;
    } else {
      filter.type = 'lowpass';
      filter.frequency.value = 3000;
    }

    this.sourceNode.connect(filter);
    filter.connect(this.gainNode);

    this.sourceNode.start();
    this.isPlaying = true;
    this.currentType = type;
  },

  /**
   * 사운드 정지
   */
  stop() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch (e) {}
      this.sourceNode = null;
    }
    this.isPlaying = false;
    this.currentType = null;
  },

  /**
   * 볼륨 조절 (0.0 ~ 1.0)
   */
  setVolume(val) {
    if (this.gainNode) {
      this.gainNode.gain.value = parseFloat(val);
    }
  }
};
