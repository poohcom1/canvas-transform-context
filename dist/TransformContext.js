export default class TransformContext {
    constructor(ctx) {
        this._transform = new DOMMatrix();
        this._savedTransforms = [];
        this.panPosition = { x: 0, y: 0 };
        this._zoom = 0;
        this.ctx = ctx;
    }
    // Transform methods
    get transform() {
        return this._transform;
    }
    save() {
        this._savedTransforms.push(this._transform);
        this.ctx.save();
    }
    restore() {
        var _a;
        this._transform = (_a = this._savedTransforms.pop()) !== null && _a !== void 0 ? _a : new DOMMatrix();
        this.ctx.restore();
    }
    scale(x, y) {
        this._transform = this._transform.scale(x, y);
        this.ctx.scale(x, y);
    }
    rotate(radians) {
        this._transform = this._transform.rotate((radians * 180) / Math.PI);
        this.ctx.rotate(radians);
    }
    translate(x, y) {
        this._transform = this._transform.translate(x, y);
        this.ctx.translate(x, y);
    }
    setTransform(a, b, c, d, e, f) {
        this._transform.a = a;
        this._transform.b = b;
        this._transform.c = c;
        this._transform.d = d;
        this._transform.e = e;
        this._transform.f = f;
        this.ctx.setTransform(a, b, c, d, e, f);
    }
    // Basic Utils
    /**
     * Converts a mouse event to the correct canvas coordinates
     * @param e mouse event
     * @returns Canvas coordinates
     */
    mouseToCanvas(e) {
        const x = e.offsetX || e.pageX - this.ctx.canvas.offsetLeft;
        const y = e.offsetY || e.pageY - this.ctx.canvas.offsetTop;
        return { x, y };
    }
    // Transform utils
    /**
     * Converts canvas coordinates to transformed coordinates
     * @param canvasPoint Canvas coordinates
     * @returns Transformed coordinates
     */
    transformPoint(canvasPoint) {
        const domPoint = new DOMPoint(canvasPoint.x, canvasPoint.y);
        return domPoint.matrixTransform(this._transform.inverse());
    }
    /**
     * Converts a mouse event to the transformed coordinates within the canvas
     * @param e mouse event
     * @returns Transformed point
     */
    mouseToTransformed(e) {
        return this.transformPoint(this.mouseToCanvas(e));
    }
    /**
     * Sets the anchor for a panning action
     * @param start Starting coordinates for a pan
     * @param transform Whether or not to transform the start coordinates
     */
    beginPan(start, transform = true) {
        this.panStart = transform ? this.transformPoint(start) : start;
    }
    /**
     * Pans the canvas to the new coordinates given the starting point in beginPan.
     * Does nothing if beginPan was not called, or if endPan was just called
     * @param current
     * @param transform Whether or not to transform the start coordinates
     */
    movePan(current, transform = true) {
        this.panPosition = transform ? this.transformPoint(current) : current;
        if (this.panStart) {
            this.translate(this.panPosition.x - this.panStart.x, this.panPosition.y - this.panStart.y);
        }
    }
    /**
     * Stops a pan
     */
    endPan() {
        this.panStart = undefined;
    }
    /**
     * Begins a pan given the current position from the mouse event
     * @param e
     */
    beginMousePan(e) {
        this.beginPan(this.mouseToCanvas(e));
    }
    /**
     * Pans the canvas to the new position from the mouse event.
     * Does nothing if beginMousePan wasn't called, or if endPan was just called
     * @param e
     */
    moveMousePan(e) {
        this.movePan(this.mouseToCanvas(e));
    }
    /**
     * Ends a mouse pan
     * @param _e Unused
     */
    endMousePan(_e) {
        this.endPan();
    }
    get zoom() {
        return this._zoom;
    }
    /**
     * Zoom by a given integer amount
     * @param amount Amount to zoom by in integers. Positive integer zooms in
     * @param zoomScale The scale percentage to zoom by. Default is 1.1
     * @param center The point to zoom in towards. If undefined, it will zoom towards the latest panned position
     * @param transform Whether or not to transform the center coordinates
     * @returns Current zoom amount in integers
     */
    zoomBy(amount, zoomScale = 1.1, center, transform = true) {
        const pt = !center
            ? this.panPosition
            : transform
                ? this.transformPoint(center)
                : center;
        this._zoom += amount;
        this.translate(pt.x, pt.y);
        const factor = Math.pow(zoomScale, amount);
        this.scale(factor, factor);
        this.translate(-pt.x, -pt.y);
        return this._zoom;
    }
    /**
     * Zooms via the mouse wheel event
     * @param e mouse wheel event
     * @param zoomScale The scale percentage to zoom by. Default is 1.1
     */
    zoomByMouse(e, zoomScale = 1.1) {
        const point = this.mouseToCanvas(e);
        this.zoomBy(-Math.sign(e.deltaY), zoomScale, point, true);
    }
    /**
     * Resets all transformations
     */
    reset() {
        this.setTransform(1, 0, 0, 1, 0, 0);
    }
    /**
     * Clear the canvas given the current transformations
     */
    clearCanvas() {
        const p1 = this.transformPoint({ x: 0, y: 0 });
        const p2 = this.transformPoint({
            x: this.ctx.canvas.width,
            y: this.ctx.canvas.height,
        });
        this.ctx.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    }
}
