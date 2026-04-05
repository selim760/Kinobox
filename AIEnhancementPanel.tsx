import { useEffect, useRef } from "react";

interface AIEnhancementPanelProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  enabled: boolean;
  quality: number;
}

// WebGL sharpening + noise reduction shader
const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform sampler2D u_image;
  uniform vec2 u_textureSize;
  uniform float u_sharpen;
  uniform float u_denoise;

  void main() {
    vec2 onePixel = vec2(1.0) / u_textureSize;
    
    // Sample neighbors for sharpening kernel
    vec4 center = texture2D(u_image, v_texCoord);
    vec4 top    = texture2D(u_image, v_texCoord + vec2(0.0, -onePixel.y));
    vec4 bottom = texture2D(u_image, v_texCoord + vec2(0.0,  onePixel.y));
    vec4 left   = texture2D(u_image, v_texCoord + vec2(-onePixel.x, 0.0));
    vec4 right  = texture2D(u_image, v_texCoord + vec2( onePixel.x, 0.0));
    
    // Unsharp mask sharpening
    vec4 blur = (top + bottom + left + right) * 0.25;
    vec4 sharpened = center + (center - blur) * u_sharpen;
    
    // Simple bilateral-style noise reduction
    vec4 tl = texture2D(u_image, v_texCoord + vec2(-onePixel.x, -onePixel.y));
    vec4 tr = texture2D(u_image, v_texCoord + vec2( onePixel.x, -onePixel.y));
    vec4 bl = texture2D(u_image, v_texCoord + vec2(-onePixel.x,  onePixel.y));
    vec4 br = texture2D(u_image, v_texCoord + vec2( onePixel.x,  onePixel.y));
    
    vec4 avg = (center + top + bottom + left + right + tl + tr + bl + br) / 9.0;
    vec4 denoised = mix(sharpened, avg, u_denoise * 0.3);
    
    gl_FragColor = clamp(denoised, 0.0, 1.0);
  }
`;

const AIEnhancementPanel = ({ videoRef, canvasRef, enabled, quality }: AIEnhancementPanelProps) => {
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || !canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
      console.warn("WebGL not available, falling back to 2D");
      // Fallback to 2D canvas processing
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const render2D = () => {
        if (!enabled) return;
        const scale = quality >= 2160 ? 2 : quality >= 1440 ? 1.5 : 1;
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        rafRef.current = requestAnimationFrame(render2D);
      };
      render2D();
      return () => cancelAnimationFrame(rafRef.current);
    }

    glRef.current = gl;

    // Compile shaders
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, VERTEX_SHADER);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, FRAGMENT_SHADER);
    gl.compileShader(fs);

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);
    programRef.current = program;

    // Setup geometry (fullscreen quad)
    const positions = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]);
    const texCoords = new Float32Array([0,1, 1,1, 0,0, 1,0]);

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const texBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuf);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    const texLoc = gl.getAttribLocation(program, "a_texCoord");
    gl.enableVertexAttribArray(texLoc);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

    // Create texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    textureRef.current = texture;

    // Uniform locations
    const uTexSize = gl.getUniformLocation(program, "u_textureSize");
    const uSharpen = gl.getUniformLocation(program, "u_sharpen");
    const uDenoise = gl.getUniformLocation(program, "u_denoise");

    // Enhancement intensity based on quality
    const sharpenAmount = quality >= 2160 ? 1.5 : quality >= 1440 ? 1.2 : 0.8;
    const denoiseAmount = quality >= 2160 ? 0.5 : quality >= 1440 ? 0.4 : 0.3;

    const renderFrame = () => {
      if (!enabled || video.paused && video.currentTime === 0) {
        rafRef.current = requestAnimationFrame(renderFrame);
        return;
      }

      const scale = quality >= 4320 ? 3 : quality >= 2160 ? 2 : quality >= 1440 ? 1.5 : 1;
      const w = Math.round(video.videoWidth * scale);
      const h = Math.round(video.videoHeight * scale);

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      gl.viewport(0, 0, w, h);
      gl.bindTexture(gl.TEXTURE_2D, texture);

      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      } catch {
        rafRef.current = requestAnimationFrame(renderFrame);
        return;
      }

      gl.uniform2f(uTexSize, video.videoWidth, video.videoHeight);
      gl.uniform1f(uSharpen, sharpenAmount);
      gl.uniform1f(uDenoise, denoiseAmount);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      rafRef.current = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      cancelAnimationFrame(rafRef.current);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteTexture(texture);
      gl.deleteBuffer(posBuf);
      gl.deleteBuffer(texBuf);
    };
  }, [enabled, quality, canvasRef, videoRef]);

  return null; // Purely logic component
};

export default AIEnhancementPanel;
