const lerp = (start, end, fraction) => {
    const remainder = (1 - fraction);
    const x = (start.x * remainder) + (end.x * fraction);
    const y = (start.y * remainder) + (end.y * fraction);
    return { x, y };
};

const findPoints = (left, right, count) =>
    "".padStart(count).split("").map((x, ndx, src) => lerp(left, right, ndx / src.length));

const buildDot = (left, right, fraction, color) => {
    const foundPoint = lerp(left, right, fraction);
    const result = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    result.setAttribute("cx", `${foundPoint.x}`);
    result.setAttribute("cy", `${foundPoint.y}`);
    result.setAttribute("r", `1`);
    const currCol = `hsl(${color} 100% 50%)`;
    result.setAttribute("fill", currCol);
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
        acc.push(left.map((x, ndx) => lerp(x, curr[ndx], ndx / curr.length)));
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
        const showLines = document.getElementById("showLines").checked;
        acc.push(buildLine(left, curr, "black", showLines));
        if (src.length - ndx > 1) {
            acc.push(curr);
        }
    } else {
        acc.push(curr);
    }
    return acc;
}

// map from control points to "guide points"
// and then lerp every consecutive pair of guide points until down to two 
const buildExtended = (pointCount = 10, ...points) => {
    const guidePoints = points.reduce(reduceToGuide(pointCount), []);
    let lerpPoints = JSON.parse(JSON.stringify(guidePoints));
    while (lerpPoints.length > 2) {
        lerpPoints = lerpPoints.reduce(reduceByLerp, []);
    }
    const result = "".padStart(pointCount)
        .split("")
        .map((x, ndx, src) =>
            buildDot(lerpPoints[0][ndx], lerpPoints[1][ndx],
                ndx / (src.length - 1), ndx * (360 / pointCount)));
    const lines = points.reduce(reduceToLines, []);
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
    result.addEventListener('click', buildClicker(result, controlPoints, guidePoints));
    return result;
}

const buildPen = () => {
    const parent = document.getElementById("bezier");
    while (parent.childNodes.length > 0) parent.removeChild(parent.childNodes[0]);
    const controlPoints = Number(document.getElementById("controlPoints").value);
    const guidePoints = Number(document.getElementById("guidePoints").value);
    const size = Math.max(Math.min(window.innerWidth * .8, window.innerHeight * .8), 300);
    parent.appendChild(buildSVG(size, controlPoints, guidePoints));
}

const toggleLines = () => {
    const children = document.getElementById("bezier").childNodes[0].childNodes;
    const showLines = document.getElementById("showLines").checked;
    children.forEach(elem => {
        if (elem.nodeName == 'line') {
            elem.setAttribute("display", showLines ? "all" : "none");
        }
    });
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

const buildShotUrl = (shotImage) => {
    let shotCanvas = document.createElement('canvas');
    shotCanvas.width = viewWidth;
    shotCanvas.height = viewHeight;
    let shotContext = shotCanvas.getContext('2d');
    shotContext.drawImage(shotImage, 0, 0);
    return shotCanvas.toDataURL();
}

const buildShotCanvas = (shotImage, shotUrl) => () => {
    saveFile(shotUrl, buildShotUrl(shotImage), "bezier_" + new Date().toISOString() + ".png");
};

const grabScreenshot = () => {
    const svgTag = document.getElementById("bezier").childNodes[0];
    let shotImage = new Image();
    let tagClone = svgTag.cloneNode(true);
    let shotBlob = new Blob([tagClone.outerHTML], {type: "image/svg+xml;charset=utf-8"});
    let shotUrl = URL.createObjectURL(shotBlob);
    shotImage.src = shotUrl;
    shotImage.onload = buildShotCanvas(shotImage, shotUrl);
};

const controlPoints = document.getElementById("controlPoints");
controlPoints.addEventListener('change', () => buildPen());
const guidePoints = document.getElementById("guidePoints");
guidePoints.addEventListener('change', () => buildPen());
const showLines = document.getElementById("showLines");
showLines.addEventListener('change', () => toggleLines());
const save = document.getElementById("save");
save.addEventListener('click', () => grabScreenshot());

buildPen();
