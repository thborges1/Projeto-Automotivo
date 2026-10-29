export function bindTouchControls(ui, controls) {
  let stickPointer = null, lookPointer = null, lastX = 0, lastY = 0;
  const joystick = ui.$('joystick'), stick = ui.$('stick'), look = ui.$('look-zone');
  const reset = () => { stickPointer = null; lookPointer = null; controls.stick.x = controls.stick.y = 0; stick.style.transform = 'translate(0px, 0px)'; };
  const update = e => {
    const rect = joystick.getBoundingClientRect();
    let x = (e.clientX - rect.left - rect.width / 2) / 38;
    let y = (e.clientY - rect.top - rect.height / 2) / 38;
    const length = Math.hypot(x, y);
    if (length > 1) { x /= length; y /= length; }
    controls.stick.x = x; controls.stick.y = y;
    stick.style.transform = `translate(${x * 32}px, ${y * 32}px)`;
  };
  joystick.onpointerdown = e => { if (!controls.active || stickPointer !== null) return; stickPointer = e.pointerId; joystick.setPointerCapture(e.pointerId); update(e); };
  joystick.onpointermove = e => { if (e.pointerId === stickPointer && controls.active) update(e); };
  joystick.onpointerup = joystick.onpointercancel = joystick.onlostpointercapture = reset;
  look.onpointerdown = e => { if (!controls.active || lookPointer !== null) return; lookPointer = e.pointerId; lastX = e.clientX; lastY = e.clientY; look.setPointerCapture(e.pointerId); };
  look.onpointermove = e => { if (e.pointerId !== lookPointer || !controls.active) return; controls.look((e.clientX - lastX) * 1.4, (e.clientY - lastY) * 1.4); lastX = e.clientX; lastY = e.clientY; };
  look.onpointerup = look.onpointercancel = look.onlostpointercapture = () => { lookPointer = null; };
  // Keep the reset callback contract; expose teardown for the application owner.
  reset.dispose = () => {
    reset();
    for (const element of [joystick, look]) {
      for (const name of ['onpointerdown', 'onpointermove', 'onpointerup', 'onpointercancel', 'onlostpointercapture']) element[name] = null;
    }
  };
  return reset;
}
