/*  基于 Web Worker + OffscreenCanvas 把 Canvas 从主线程剥离
    实现多线程渲染，优化动画卡顿 */

import { GestureRecognizerResult, Landmark } from "@mediapipe/tasks-vision";

let canvasCtx: OffscreenCanvasRenderingContext2D | null = null;

self.onmessage = (message) => {
  if (message.data.canvas && !canvasCtx) {
    canvasCtx = message.data.canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
  }

  if (message.data.gestureData && canvasCtx) {
    // 清除之前的绘制
    canvasCtx.clearRect(0, 0, canvasCtx.canvas.width, canvasCtx.canvas.height);

    const gestureData: GestureRecognizerResult = message.data.gestureData;
    const { landmarks, handedness, gestures } = gestureData;

    gestures.forEach((_, index) => {
      const isLeftHand = handedness[index] && handedness[index][0].categoryName === "Left";
      drawHand(landmarks[index], canvasCtx!, isLeftHand)
    });
  }
};


function drawHand(handLandmarks: Landmark[], canvasCtx: OffscreenCanvasRenderingContext2D, isLeftHand: boolean) {

  const fingerConnections = [
    [0, 1, 2, 3, 4], // 大拇指
    [0, 5, 6, 7, 8], // 食指
    [9, 10, 11, 12], // 中指
    [13, 14, 15, 16], // 无名指
    [0, 17, 18, 19, 20], // 小指
  ];

  // 定义左手和右手的不同样式
  const handColors = {
    left: {
      point: "#b4ea3e",
      line: "#54e856",
    },
    right: {
      point: "#57e6ff",
      line: "#06ffe2",
    },
  };

  canvasCtx.fillStyle = handColors[isLeftHand ? "left" : "right"].point;
  canvasCtx.strokeStyle = handColors[isLeftHand ? "left" : "right"].line;
  canvasCtx.lineWidth = 3;

  // 遍历手指连接关系并绘制点和线
  fingerConnections.forEach((finger) => {
    finger.forEach((pointIdx, idx, arr) => {
      const currentPoint = handLandmarks[pointIdx];
      const x = currentPoint.x * canvasCtx.canvas.width;
      const y = currentPoint.y * canvasCtx.canvas.height;

      // 绘制点
      canvasCtx.beginPath();
      canvasCtx.arc(x, y, 3, 0, 2 * Math.PI); // 使用 pointSize 作为半径
      canvasCtx.fill();

      // 绘制连接线
      if (idx < arr.length - 1) {
        const nextPoint = handLandmarks[arr[idx + 1]];
        const nextX = nextPoint.x * canvasCtx.canvas.width;
        const nextY = nextPoint.y * canvasCtx.canvas.height;
        canvasCtx.beginPath();
        canvasCtx.moveTo(x, y);
        canvasCtx.lineTo(nextX, nextY);
        canvasCtx.stroke();
      }
    });
  });

  // 单独处理以下点（形成手掌轮廓）
  const jointIndices = [5, 9, 13, 17];

  jointIndices.forEach((jointIdx, idx) => {
    const currentJoint = handLandmarks[jointIdx];
    const x = currentJoint.x * canvasCtx.canvas.width;
    const y = currentJoint.y * canvasCtx.canvas.height;

    // 绘制连接线
    if (idx < jointIndices.length - 1) {
      const nextJoint = handLandmarks[jointIndices[idx + 1]];
      const nextX = nextJoint.x * canvasCtx.canvas.width;
      const nextY = nextJoint.y * canvasCtx.canvas.height;
      canvasCtx.beginPath();
      canvasCtx.moveTo(x, y);
      canvasCtx.lineTo(nextX, nextY);
      canvasCtx.stroke();
    }
  });
}