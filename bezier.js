const lerp = (start, end, fraction) => {
    const remainder = (1 - fraction);
    const x = (start.x * remainder) + (end.x * fraction);
    const y = (start.y * remainder) + (end.y * fraction);
    return { x, y };
};

const findPoints = (left, right, count) =>
    "".padStart(count).split("").map((x, ndx, src) => lerp(left, right, ndx / src.length));

const buildDot = (left, right, fraction, color, showDot) => {
    const foundPoint = lerp(left, right, fraction);
    const result = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    result.setAttribute("cx", `${foundPoint.x}`);
    result.setAttribute("cy", `${foundPoint.y}`);
    result.setAttribute("r", `1`);
    const currCol = `hsl(${color} 100% 50%)`;
    result.setAttribute("fill", currCol);
    result.setAttribute("display", showDot ? "all" : "none");
    return result;
};

const buildLine = (left, right, color, showLines) => {
    const result = document.createElementNS("http://www.w3.org/2000/svg", "line");
    result.setAttribute("x1", left.x);
    result.setAttribute("y1", left.y);
    result.setAttribute("x2", right.x);
    result.setAttribute("y2", right.y);
    result.setAttribute("stroke", color);
    result.setAttribute("display", showLines ? "all" : "none");
    return result;    
}

const reduceToGuide = (pointCount) => (acc, curr, ndx, src) => {
    if (acc.length > 0) {
        const left = acc.pop();
        acc.push(findPoints(left, curr, pointCount));
        if (src.length - ndx > 1) {
            acc.push(curr);
        }
    } else {
        acc.push(curr);
    }
    return acc;
}

const reduceByLerp = (acc, curr, ndx, src) => {
    if (acc.length > 0) {
        const left = acc.pop();
        acc.push(left.map((x, guideNdx) => lerp(x, curr[guideNdx], guideNdx / curr.length)));
        if (src.length - ndx > 1) {
            acc.push(curr);
        }
    } else {
        acc.push(curr);
    }
    return acc;
}

const reduceToLines = (acc, curr, ndx, src) => {
    if (acc.length > 0) {   
        const left = acc.pop();
        acc.push(buildLine(left, curr, "black", document.getElementById("showLines").checked));
        if (src.length - ndx > 1) {
            acc.push(curr);
        }
    } else {
        acc.push(curr);
    }
    return acc;
}

const buildCurve = (lerpPoints, pointCount, showStrings) =>
    (x, ndx, src) => {
        return [
            buildLine(lerpPoints[0][ndx], lerpPoints[1][ndx],
                `hsl(${ndx * (360 / pointCount)} 100% 50%)`, showStrings),
            buildDot(lerpPoints[0][ndx], lerpPoints[1][ndx],
                ndx / (src.length - 1), ndx * (360 / pointCount), !showStrings)
        ];
    }

// map from control points to "guide points"
// and then lerp every consecutive pair of guide points until down to two 
const buildExtended = (pointCount = 10, ...points) => {
    const realPoints = [...points];
    if (document.getElementById("closed").checked) {
        realPoints.push(points[0]);
    }
    const guidePoints = realPoints.reduce(reduceToGuide(pointCount), []);
    let lerpPoints = JSON.parse(JSON.stringify(guidePoints));
    while (lerpPoints.length > 2) {
        lerpPoints = lerpPoints.reduce(reduceByLerp, []);
    }
    const showStrings = document.getElementById("showStrings").checked;
    const result = "".padStart(pointCount).split("").flatMap(buildCurve(lerpPoints, pointCount, showStrings));
    const lastNdx = lerpPoints[0].length - 1;
    const lines = realPoints.reduce(reduceToLines, []);
    result.push(...lines);
    return result;
}

const drawTextCell = ({x, y}, num) => {
    const result = document.createElementNS("http://www.w3.org/2000/svg", "text");
    result.setAttribute("x", x - 5);
    result.setAttribute("y", y + 5);
    result.setAttribute("fill", "green");
    result.setAttribute("stroke", "green");
    result.appendChild(document.createTextNode(num));
    return result;
};

const buildClicker = (svg, controlPoints, guidePoints) => {
    const points = [];

    return (event) => {
        const currPoint = { x: event.offsetX, y: event.offsetY };
        points.push(currPoint);
        if (points.length === controlPoints) {
            while (svg.childNodes.length > 0) svg.removeChild(svg.childNodes[0]);
            buildExtended(guidePoints, ...points).forEach(x => svg.appendChild(x));
            while (points.length > 0) points.pop();
        } else {
            svg.appendChild(drawTextCell(currPoint, points.length));
        }
    }
}

const buildSVG = (height, controlPoints, guidePoints) => {
    const result = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    result.setAttribute("version", "1.0");
    result.setAttribute("style", "background-color: white");
    result.setAttribute('viewbox', `0 0 ${height} ${height}`);
    result.setAttribute('height', height);
    result.setAttribute('width', height);
    result.setAttribute('id', 'svgTag')
    result.addEventListener('click', buildClicker(result, controlPoints, guidePoints));
    return result;
}

const windowScaler = .75;

const buildPen = () => {
    const parent = document.getElementById("bezier");
    while (parent.childNodes.length > 0) parent.removeChild(parent.childNodes[0]);
    const controlPoints = Number(document.getElementById("controlPoints").value);
    const guidePoints = Number(document.getElementById("guidePoints").value);
    const size = Math.max(Math.min(window.innerWidth * windowScaler, window.innerHeight * windowScaler), 300);
    parent.appendChild(buildSVG(size, controlPoints, guidePoints));
}

const toggleLines = () => {
    const children = document.getElementById("bezier").childNodes[0].childNodes;
    const showLines = document.getElementById("showLines").checked;
    const display = showLines ? "all" : "none";
    [...children].filter(x => x.nodeName == 'line')
        .filter(x => x.getAttribute('stroke') === "black")
        .forEach(x => x.setAttribute("display", display));
}

const toggleStrings = () => {
    const children = document.getElementById("bezier").childNodes[0].childNodes;
    const showStrings = document.getElementById("showStrings").checked;
    let display = showStrings ? "all" : "none";
    [...children].filter(x => x.nodeName == 'line')
        .filter(x => x.getAttribute('stroke') !== "black")
        .forEach(x => x.setAttribute("display", display));
    display = showStrings ? "none" : "all";
    [...children].filter(x => x.nodeName == 'circle')
        .forEach(x => x.setAttribute("display", display));
}

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

const buildShotUrl = (shotImage, width, height) => {
    let shotCanvas = document.createElement('canvas');
    shotCanvas.width = width;
    shotCanvas.height = height;
    let shotContext = shotCanvas.getContext('2d');
    shotContext.drawImage(shotImage, 0, 0);
    return shotCanvas.toDataURL();
}

const buildShotCanvas = (shotImage, shotUrl, width, height) => { 
    return () => {
        saveFile(shotUrl, buildShotUrl(shotImage, width, height), "bezier_" + new Date().toISOString() + ".png");
        defaultState.isAnimating = true;
    }
};

const grabScreenshot = () => {
    const svgTag = document.getElementById("svgTag");
    const width = Number(svgTag.getAttribute('width'));
    const height = Number(svgTag.getAttribute('height'));
    const shotImage = new Image();
    const tagClone = svgTag.cloneNode(true);
    const shotBlob = new Blob([tagClone.outerHTML], {type: "image/svg+xml;charset=utf-8"});
    const shotUrl = URL.createObjectURL(shotBlob);
    shotImage.src = shotUrl;
    shotImage.onload = buildShotCanvas(shotImage, shotUrl, width, height);
};

const controlPoints = document.getElementById("controlPoints");
controlPoints.addEventListener('change', () => buildPen());
const guidePoints = document.getElementById("guidePoints");
guidePoints.addEventListener('change', () => buildPen());
const showLines = document.getElementById("showLines");
showLines.addEventListener('change', () => toggleLines());
const showStrings = document.getElementById("showStrings");
showStrings.addEventListener('change', () => toggleStrings());
const save = document.getElementById("save");
save.addEventListener('click', () => grabScreenshot());

buildPen();
