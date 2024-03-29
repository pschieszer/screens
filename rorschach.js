const defaultState = {
	sizeX: 0,
	sizeY: 0,
	spread: 75,
	symX: true,
	symY: true,
	pointCount: 1200,
	pointAttr: { color: 0 },
	delay: 5000,
	frameCount: 6,
	displayMode: "dots",
	pointSource: "rorschach",
	isAnimating: true,
	wakeLock: false
};

let pointHistory = [];

let viewBox = undefined;

const getRand = (x) => Math.floor(Math.random() * x);

const getOffset = (state) => {
	let theta = getRand(360);
	let radius = getRand(state.spread);
	return ({x: (radius * Math.cos(theta)), y: (radius * Math.sin(theta))});
};

const isOdd = (value, whenOdd = true, whenEven = false) => Math.floor(value % 2) == 1 ? whenOdd : whenEven;

const rorschach = function* (state) {
	let currX = state.startX;
	let currY = state.startY;
	// yield up to four points on each iteration
	for (let pntNdx = 0; pntNdx < state.pointCount; pntNdx++) {
		yield ({x: currX, y: currY, id: `pnt${pntNdx}`, ...state.pointAttr});
		if (state.symX)
			yield ({x: (state.sizeX - currX), y: currY, id: `pnt${pntNdx}symX`, ...state.pointAttr});
		if (state.symY)
			yield ({x: currX, y: (state.sizeY - currY), id: `pnt${pntNdx}symY`, ...state.pointAttr});
		if (state.symX && state.symY)
			yield ({x: (state.sizeX - currX), y: (state.sizeY - currY), id: `pnt${pntNdx}bothSym`, ...state.pointAttr});
		let mover = getOffset(state);
		currX += mover.x;
		currY += mover.y;
		if (pntNdx % 17 == 3) {
			// let the symmetry settings randomly change every 17 iterations
			//  because it increases the randomness of the output
			state.symY = isOdd(currY);
			state.symX = isOdd(currX);
		}
	}
};

const calcFrequency = (distance) => Math.sqrt(distance * .6);

const sinus = function* (state) {
	const zeroX = state.startX;
	const zeroY = state.startY;
	const nearY = Math.min((state.sizeY - zeroY), zeroY);
	const farX = Math.max((state.sizeX - zeroX), zeroX);
	const amplitude = nearY / 2;
	const sign = (farX === zeroX) ? -1 : 1;
	const incX = sign * farX / Number(state.pointCount);
	const trig = isOdd(zeroX, Math.sin, Math.cos);
	const freq = calcFrequency(farX);
	let theta = 0;
	for (let pntNdx = 0; pntNdx < state.pointCount; pntNdx++) {
		yield ({
			x: zeroX + theta,
			y: (amplitude * trig(sign * theta / freq)) + zeroY,
			id: `pnt${pntNdx}`,
			...state.pointAttr
		});
		theta += incX;
	}
};

const tangent = function* (state) {
	let currX = state.startX;
	let currY = state.startY;
	const amplitude = (state.sizeX - currX) / 60;
	const farX = Math.max((state.sizeX - currX), currX);
	const sign = (farX === currX) ? -1 : 1;
	const freq = calcFrequency(farX);
	const zeroX = currX;
	const zeroY = currY;
	const incX = sign * farX / Number(state.pointCount);
	let theta = 0;
	for (let pntNdx = 0; pntNdx < state.pointCount; pntNdx++) {
		currY = (amplitude * Math.tan(theta)) + zeroY;
		yield ({x: currX, y: currY, id: `pnt${pntNdx}`, ...state.pointAttr});
		currX += incX;
		theta += (sign * incX / freq);
	}
};

const arch = function* (state) {
	state.startY = Math.min(state.startY, state.sizeY / 68.8);
	state.startX = Math.min(state.startX, state.sizeX - 600);
	let currX = state.startX;
	let currY = state.startY;
	const farX = Math.max((state.sizeX - currX), currX);
	const rot = Math.floor(farX % 20) - 10;
	const freq = calcFrequency(farX);
	const zeroX = currX;
	const zeroY = currY;
	const incX = 600 / Number(state.pointCount);
	let currColor = state.pointAttr.color;
	let theta = -300;
	for (let pntNdx = 0; pntNdx < state.pointCount; pntNdx++) {
		currY = (68.8 * (Math.cosh(0.01 * theta) + 1)) + zeroY;
		let currPoint = myRot([currX, currY], rot);
		yield ({x: currX, y: currY, id: `pnt${pntNdx}`, color: currColor});
		currColor = (currColor + 1) % 360;
		currX += incX;
		theta += incX;
	}
};

const sawtooth = function* (state) {
	let currX = state.startX;
	let currY = state.startY;
	let diff = 0;
	const nearY = Math.min((state.sizeY - currY), currY);
	const amplitude = nearY;
	const zeroX = currX;
	const zeroY = currY;
	const incX = (state.sizeX - zeroX) / nearY;
	for (let pntNdx = 0; pntNdx < state.pointCount; pntNdx++) {
		currX += incX;
		diff = currX - zeroX;
		currY = (amplitude * (diff - Math.floor(diff))) + zeroY;
		yield ({x: currX, y: currY, id: `pnt${pntNdx}`, ...state.pointAttr});
	}
};

const fourier = (x, n) => (4 * Math.sin(n * x)) / (Math.PI * n);

const square = function* (state) {
	let currX = state.startX;
	let currY = state.startY;
	const nearY = Math.min((state.sizeY - currY), currY);
	const farX = Math.max((state.sizeX - currX), currX);
	const sign = (farX === currX) ? -1 : 1;
	const freq = calcFrequency(farX);
	const amplitude = nearY / 2;
	const zeroY = currY;
	const incX = sign * farX / Number(state.pointCount);
	let theta = 0;
	const coefficients = [1, 3, 5, 7, 9, 11];
	for (let pntNdx = 0; pntNdx < state.pointCount; pntNdx++) {
		let norm = coefficients.reduce((acc, curr) => acc + fourier(theta, curr), 0);
		currY = (amplitude * norm) + zeroY;
		yield ({x: currX, y: currY, id: `pnt${pntNdx}`, ...state.pointAttr});
		currX += incX;
		theta += (sign * incX / freq);
	}
};

const hilbert_map = [
	{ currentState: 'a', inX: 0, inY: 0, outBit: 0, nextState: 'd'},
	{ currentState: 'a', inX: 0, inY: 1, outBit: 1, nextState: 'a'},
	{ currentState: 'a', inX: 1, inY: 0, outBit: 3, nextState: 'b'},
	{ currentState: 'a', inX: 1, inY: 1, outBit: 2, nextState: 'a'},
	{ currentState: 'b', inX: 0, inY: 0, outBit: 2, nextState: 'b'},
	{ currentState: 'b', inX: 0, inY: 1, outBit: 1, nextState: 'b'},
	{ currentState: 'b', inX: 1, inY: 0, outBit: 3, nextState: 'a'},
	{ currentState: 'b', inX: 1, inY: 1, outBit: 0, nextState: 'c'},
	{ currentState: 'c', inX: 0, inY: 0, outBit: 2, nextState: 'c'},
	{ currentState: 'c', inX: 0, inY: 1, outBit: 3, nextState: 'd'},
	{ currentState: 'c', inX: 1, inY: 0, outBit: 1, nextState: 'c'},
	{ currentState: 'c', inX: 1, inY: 1, outBit: 0, nextState: 'b'},
	{ currentState: 'd', inX: 0, inY: 0, outBit: 0, nextState: 'a'},
	{ currentState: 'd', inX: 0, inY: 1, outBit: 3, nextState: 'c'},
	{ currentState: 'd', inX: 1, inY: 0, outBit: 1, nextState: 'd'},
	{ currentState: 'd', inX: 1, inY: 1, outBit: 2, nextState: 'd'}
];

const mapFromHilbert = (num) => {
	const order = 30;
	let currState = 'a';
	let currNum = num;
	let result = { x: 0, y: 0 };
	// running the mapTo algorithm "backwards"
	for (let currOrder = order; currOrder > -1; currOrder -= 2) {
		result.x <<= 1;
		result.y <<= 1;
		currNum = (num & (3 << currOrder)) >> currOrder;
		var currEnt = hilbert_map.filter(x => x.currentState == currState && x.outBit == currNum).shift();
		currState = currEnt.nextState;
		result.x |= currEnt.inX;
		result.y |= currEnt.inY;
	};
	return result;
};

const normalizeHilbert = (pntNdx, xOff, xSign, yOff, ySign, spread) => {
	let result = mapFromHilbert(pntNdx);
	return { x: xOff + (xSign * result.x * spread), y: yOff + (ySign * result.y * spread) };
};

const hilbert = function* (state) {
	// change default spread
	if (!buildParms.get('spread')) state.spread = 5;
	const farX = Math.max((state.sizeX - state.startX), state.startX);
	const xSign = (farX === state.startX) ? -1 : 1;
	const farY = Math.max((state.sizeY - state.startY), state.startY);
	const ySign = (farY === state.startY) ? -1 : 1;
	let currColor = state.pointAttr.color;

	for (let pntNdx = 0; pntNdx < state.pointCount; pntNdx++) {
		yield ({
			...normalizeHilbert(pntNdx, state.startX, xSign, state.startY, ySign, state.spread),
			id: `pnt${pntNdx}`,
			color: currColor
		});
		currColor = (currColor + 1) % 360;
	}
};

const calcLinePoint = (currVertex, nextVertex, currSide, nextSide, origin) => [
	origin[0] + (nextSide * currVertex[0] + currSide * nextVertex[0]) / (currSide + nextSide),
	origin[1] + (nextSide * currVertex[1] + currSide * nextVertex[1])/ (currSide + nextSide)
];

const radiansPerDegree = Math.PI / 180;

const myRot = (point, deg) => {
	let rad = Number(deg) * radiansPerDegree;
	return [point[0] * Math.cos(rad) + point[1] * Math.sin(rad),
		    point[0] * (-1 * Math.sin(rad)) + point[1] * Math.cos(rad)];
}

const drawLines = function* (state, vertexes) {
	const pointsPerSeg = Math.floor(state.pointCount / vertexes.length);
	const plySize = pointsPerSeg * vertexes.length;
	const farX = Math.max((state.sizeX - state.startX), state.startX);
	const xSign = (farX === state.startX) ? -1 : 1;
	const farY = Math.max((state.sizeY - state.startY), state.startY);
	const ySign = (farY === state.startY) ? -1 : 1;
	// need to normalize around the "origin"
	const origin = [state.startX + (xSign * (.5 * farX)), state.startY + (ySign * (.5 * farY))];
	let currVertex = -1;
	for (let pntNdx = 0; pntNdx < plySize; pntNdx++) {
		currVertex += (pntNdx % pointsPerSeg === 0) ? 1 : 0;
		let nextVertex = (currVertex + 1) % vertexes.length;
		let currSide = pntNdx % pointsPerSeg;
		let nextSide = pointsPerSeg - currSide;
		let [currX, currY] = calcLinePoint(vertexes[currVertex], vertexes[nextVertex], currSide, nextSide, origin);
		yield ({x: currX, y: currY, id: `pnt${pntNdx}`, ...state.pointAttr});
	}
};

const hexagon = function* (state) {
	const farX = Math.max((state.sizeX - state.startX), state.startX);
	const farY = Math.max((state.sizeY - state.startY), state.startY);
	const area = farX * farY * .2;
	const root3 = Math.sqrt(3);
	const sideLength = Math.sqrt((2 / (3 * root3)) * area);
	const rot = Math.floor(farX % 60);
	// rotate the vertexes by random angle
	const vertexes = [[-1 * sideLength, 0], [-.5 * sideLength, .5 * root3 * sideLength],
		[.5 * sideLength, .5 * root3 * sideLength], [sideLength, 0],
		[.5 * sideLength, -.5 * root3 * sideLength], [-.5 * sideLength, -.5 * root3 * sideLength]].map(x => myRot(x, rot));
	yield* drawLines(state, vertexes);
};

const StarX = [.25 * (Math.sqrt(5) - 1), .25 * (Math.sqrt(5) + 1)];
const StarY = [.25 * Math.sqrt(10 + (2 * Math.sqrt(5))), .25 * Math.sqrt(10 - (2 * Math.sqrt(5)))];

const fiveStar = function* (state) {
	const farX = Math.max((state.sizeX - state.startX), state.startX);
	const farY = Math.max((state.sizeY - state.startY), state.startY);
	const sideLength = Math.min(farX, farY) * .4;
	const rot = Math.floor(farX % 72);
	const vertexes = [[sideLength, 0], [-1 * sideLength * StarX[1], -1 * sideLength * StarY[1]],
		[sideLength * StarX[0], sideLength * StarY[0]], [sideLength * StarX[0], -1 * sideLength * StarY[0]],
		[-1 * sideLength * StarX[1], sideLength * StarY[1]]].map(x => myRot(x, rot));
	yield* drawLines(state, vertexes);
};

const randomSource = function* (state) {
	yield* SourceLookup[getRand(SourceLookup.length)][1](state);
};

const SourceLookup = [["rorschach", rorschach], ["sinus", sinus], ["tangent", tangent],
	 ["sawtooth", sawtooth], ["square", square], ["hilbert", hilbert], ["hexagon", hexagon],
	 ["5star", fiveStar], ["arch", arch], ["random", randomSource]];

const getPointSourceOptions = ({ pointSource }) => {
	const allSources = pointSource.split(",").map(x => x.trim().toLowerCase());
	const foundSource = SourceLookup.filter(x => allSources.indexOf(x[0]) > -1).map(x => x[1]);
	return (foundSource) ? foundSource : [ rorschach ];
};

const getPointSource = (state) => {
	const sources = getPointSourceOptions(state);
	return sources[getRand(sources.length)];
};

const generatePoints = function* (state) {
	yield* getPointSource(state)(state);
};

const drawDot = ({x, y, id, color}) => {
	const result = document.createElementNS("http://www.w3.org/2000/svg", "circle");
	result.setAttribute("id", id);
	result.setAttribute("cx", `${x}`);
	result.setAttribute("cy", `${y}`);
	result.setAttribute("r", `1`);
	const currCol = `hsl(${color} 100% 50%)`;
	result.setAttribute("fill", currCol);
	result.setAttribute("stroke", currCol);
	return result;
};

const getFromRange = (min, range) => getRand(range) + min;

const selectYi = () => String.fromCodePoint(getFromRange(0xA000, 1165));

const selectVai = () => String.fromCodePoint(getFromRange(0xA500, 300));

const selectHangul = () => String.fromCodePoint(getFromRange(0xAC00, 11172));

const selectCanadian = () => String.fromCodePoint(getFromRange(0x1400, 640));

// continguous blocks of code points that have a bunch of emojis to choose from
const EmojiBox = [[0x2600, 0x26FF], [0x2700, 0x27BF], [0x1F600, 0x1F6D5],
	 [0x1F300, 0x1F53D], [0x1F700, 0x1F773], [0x1F900, 0x1F9FF]];

const getEmojiCodePoint = () => {
	const [min, max] = EmojiBox[getRand(EmojiBox.length)];
	return getFromRange(min, max - min);
}

const selectEmoji = () => [getEmojiCodePoint(), 0x200d, getEmojiCodePoint(), 0xfe0f].map(x => String.fromCodePoint(x)).join("");

const drawTextCell = (selector) => ({x, y, id, color}) => {
	const result = document.createElementNS("http://www.w3.org/2000/svg", "text");
	result.setAttributeNS(null, "x", x);
	result.setAttributeNS(null, "y", y);
	result.setAttribute("id", id);
	const currCol = `hsl(${color} 100% 50%)`;
	result.setAttribute("fill", currCol);
	result.setAttribute("stroke", currCol);
	result.appendChild(document.createTextNode(selector()));
	return result;
};

const drawEmoji = drawTextCell(selectEmoji);

const drawYi = drawTextCell(selectYi);

const drawVai = drawTextCell(selectVai);

const drawHangul = drawTextCell(selectHangul);

const drawCanadian = drawTextCell(selectCanadian);

const buildPath = (currId, currD, color) => {
	const result = document.createElementNS("http://www.w3.org/2000/svg", "path");
	result.setAttribute("id", currId);
	result.setAttribute("d", currD);
	result.setAttribute("class", "line");
	const currCol = `hsl(${color} 100% 50%)`;
	result.setAttribute("fill", "none");
	result.setAttribute("stroke", currCol);
	result.setAttribute("stroke-width", "2");
	result.setAttribute("stroke-linecap", "round");
	return result;
};

const buildMat = (x, y) => `matrix(.3 0 0 .3 ${x} ${y})`;

const drawDude = ({x, y, id, color}) => {
	const result = document.createElementNS("http://www.w3.org/2000/svg", "g");
	const allElems = [ ["arms", "M 36 107 L 87.5 123 L 139 107"],
					   ["legs", "M 47 216 L 87.5 156 L 128 216"],
					   ["torso", "M 87.5 156 v -63"],
					   ["head", "M 125.5 58 A 37 34 0 1 1 51 58 A 37 34 0 1 1 125.5 58 z"],
					   ["leftEye", "M 85  51 A 6 6 0 1 1 73 51 A 6 6 0 1 1 85  51 z"],
					   ["rightEye", "M 104 51 A 6 6 0 1 1 92 51 A 6 6 0 1 1 104 51 z"],
					   ["smile", "M 109.5 69 A 29 34 0 0 1 69.5 70.5"] ];
	allElems.map(e => buildPath(e[0], e[1], color)).forEach(e => result.appendChild(e));
	result.setAttribute('transform', buildMat(x, y));
	return result;
}

const buildParms = new URLSearchParams(window.location.search);
const requestable = ['displayMode', 'pointCount', 'delay', 'frameCount', 'spread', 'pointSource', 'height', 'width', 'wakeLock'];

const getParam = (attrib) => {
	const requested = buildParms.get(attrib);
	return (requested) ? requested : defaultState[attrib];
};

const getNumWithDefault = (param, def) => {
	const found = getParam(param);
	return (found) ? Number(found) : def;
};

const getHeight = () => getNumWithDefault('height', window.innerHeight * .98);

const getWidth = () => getNumWithDefault('width', window.innerWidth * .98);

const getState = () => {
	const result = JSON.parse(JSON.stringify(defaultState));
	result.sizeX = getWidth();
	result.sizeY = getHeight();
	requestable.forEach(x => { let param = getParam(x); if (param) result[x] = param; });
	return result;
};

const GeneratorLookup = [["dots", drawDot], ["emojis", drawEmoji], ["dude", drawDude],
	["yi", drawYi], ["vai", drawVai], ["hangul", drawHangul], ["canadian", drawCanadian]];

const getGeneratorOptions = ({ displayMode }) => {
	const allGenerators = displayMode.split(",").map(x => x.trim().toLowerCase());
	const foundMode = GeneratorLookup.filter(x => allGenerators.indexOf(x[0]) > -1).map(x => x[1]);
	return (foundMode) ? foundMode : [ drawDot ];
};

const getGenerator = (state) => {
	const generators = getGeneratorOptions(state);
	return generators[getRand(generators.length)];
};

const loadStarts = (state, { x, y, color, displayMode, pointSource }) => {
	state.startX = (x) ? x : getRand(state.sizeX);
	state.startY = (y) ? y : getRand(state.sizeY);
	state.pointAttr.color = (color) ? color : getRand(360);
	state.displayMode = (displayMode) ? displayMode : state.displayMode;
	state.pointSource = (pointSource) ? pointSource : state.pointSource;
	return state;
};

const loadRandomStarts = state =>
	loadStarts(state,
		{ x: undefined, y: undefined, color: undefined, displayMode: undefined, pointSource: undefined });

const recordHistory = (state) => {
	const event = {
		color: state.pointAttr.color,
		x: state.startX,
		y: state.startY,
		displayMode: state.displayMode,
		pointSource: state.pointSource
	};
	// only keep the most recent frames
	while (pointHistory.length > 300) pointHistory.shift();
	// add new
	pointHistory.push(event);
};

const Url = window.URL || window.webkitURL || window;

const saveFile = (parentUrl, dataUrl, fileName) => {
	var currLink = document.createElement("a");
	document.body.appendChild(currLink); // This line makes it work in Firefox.
	currLink.setAttribute("href", dataUrl);
	currLink.setAttribute("download", fileName);
	currLink.click();
	currLink.remove();
	Url.revokeObjectURL(parentUrl);
}

const buildShotUrl = (shotImage) => {
	let shotCanvas = document.createElement('canvas');
	shotCanvas.width = viewWidth;
	shotCanvas.height = viewHeight;
	let shotContext = shotCanvas.getContext('2d');
	shotContext.drawImage(shotImage, 0, 0);
	return shotCanvas.toDataURL();
}

const buildShotCanvas = (shotImage, shotUrl) => () => {
	saveFile(shotUrl, buildShotUrl(shotImage), "rorschach_" + new Date().toISOString() + ".png");
	defaultState.isAnimating = true;
};

const grabScreenshot = svgTag => {
	defaultState.isAnimating = false;
	let shotImage = new Image();
	let tagClone = svgTag.cloneNode(true);
	let shotBlob = new Blob([tagClone.outerHTML], {type: "image/svg+xml;charset=utf-8"});
	let shotUrl = URL.createObjectURL(shotBlob);
	shotImage.src = shotUrl;
	shotImage.onload = buildShotCanvas(shotImage, shotUrl);
};

const buildGroupAttributes = () => {
	const result = {};
	let currRot = getNumWithDefault('groupRotation', 0);
	if (currRot) result["transform"] = `rotate(${getRand(currRot) - (currRot / 2)})`;
	return result;
};

const buildSvgTag = () => {
	const result = document.createElementNS("http://www.w3.org/2000/svg", "g");
	const currState = loadRandomStarts(getState());
	const groupAttr = buildGroupAttributes();
	Object.keys(groupAttr).forEach(x => result.setAttribute(x, groupAttr[x]));
	recordHistory(currState);
	[...generatePoints(currState)].map(getGenerator(currState)).forEach(x => result.appendChild(x));
	return result;
};

const getCurrentSvg = () => document.querySelector("svg#rorschach");

let gTags = [];

const addG = (svgTag, currG) => x => { gTags.push(currG); svgTag.appendChild(currG); };

const removeG = (svgTag, currG, frameCount) => x => {
	if (defaultState.isAnimating)
		while (gTags.length >= frameCount)
			svgTag.removeChild(gTags.shift());
};

const handleWheel = (svgTag) => (e) => {
   e.preventDefault();
   let w = viewBox.w;
   let h = viewBox.h;
   let dw = w * Math.sign(e.deltaY) * 0.05;
   let dh = h * Math.sign(e.deltaY) * 0.05;
   let dx = (dw * e.offsetX / getWidth()) || (e.deltaX);
   let dy = (dh * e.offsetY / getHeight()) || (e.deltaX);
   viewBox = { x: viewBox.x + dx, y: viewBox.y + dy, w: viewBox.w - dw, h: viewBox.h - dh };
   svgTag.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
};

const loadNew = (svgTag) => {
	const delay = getNumWithDefault('delay');
	if (defaultState.isAnimating) {
		const frameCount = getNumWithDefault('frameCount');
		const frameDelay = delay / frameCount;
		for (let currFrame = 0; currFrame < frameCount; currFrame++) {
			let currG = buildSvgTag();
			let currDelay = frameDelay * (currFrame + 1);
			window.setTimeout(addG(svgTag, currG), currDelay);
			window.setTimeout(removeG(svgTag, currG, frameCount), (currDelay + delay));
		}
	}
	// fix the viewport and viewbox
	window.setTimeout(() => loadNew(svgTag), delay);
};

let wakeLock = undefined;

const handleVisibilityChange = async () => {
	if (document.visibilityState === 'visible') {
		checkWakeLock();
	}
};

const wakeLockSuccess = (lock) => {
	wakeLock = lock;
	wakeLock.addEventListener('release', () => console.log(`wakeLock released: ${wakeLock.released}`));
	document.addEventListener('visibilitychange', handleVisibilityChange);
	console.log(`wakeLock is set`);
};

const wakeLockCatch = (err) => console.error(`Unable to obtain wakeLock: ${err}`);

const checkWakeLock = () =>
	(getParam('wakeLock') !== false &&
	 navigator.wakeLock.request('screen').then(wakeLockSuccess, wakeLockCatch)) ||
	console.log(`wakeLock not requested`);

const viewHeight = getHeight();
const viewWidth = getWidth();
const svgTag = getCurrentSvg();
svgTag.setAttribute('viewbox', `0 0 ${viewWidth} ${viewHeight}`);
viewBox = { x: 0, y: 0, w: viewWidth, h: viewHeight };
svgTag.setAttribute('height', viewHeight);
svgTag.setAttribute('width', viewWidth);
svgTag.addEventListener('click', () => grabScreenshot(svgTag));
svgTag.addEventListener('wheel', handleWheel(svgTag));
loadNew(svgTag);
checkWakeLock();
