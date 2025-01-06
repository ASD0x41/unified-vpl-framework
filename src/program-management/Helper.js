export function computePoints(pin1, grp1, pin2, grp2) {
    const pin1X = pin1.left + grp1.left + grp1.width / 2;
    const pin1Y = pin1.top + grp1.top + grp1.height / 2;
    const pin2X = pin2.left + grp2.left + grp2.width / 2;
    const pin2Y = pin2.top + grp2.top + grp2.height / 2;

    let points = [{ x: pin1X, y: pin1Y }];

    if (pin1.side === "top" && pin2.side === "top") {
        if (pin1Y < pin2Y) {
            points.push({ x: pin1X, y: pin1Y - 50 });
            points.push({ x: pin2X, y: pin1Y - 50 });
        } else {
            points.push({ x: pin1X, y: pin2Y - 50 });
            points.push({ x: pin2X, y: pin2Y - 50 });
        }
    } else if (pin1.side === "bottom" && pin2.side === "bottom") {
        if (pin1Y > pin2Y) {
            points.push({ x: pin1X, y: pin1Y + 50 });
            points.push({ x: pin2X, y: pin1Y + 50 });
        } else {
            points.push({ x: pin1X, y: pin2Y + 50 });
            points.push({ x: pin2X, y: pin2Y + 50 });
        }
    } else if (pin1.side === "left" && pin2.side === "left") {
        if (pin1X < pin2X) {
            points.push({ x: pin1X - 50, y: pin1Y });
            points.push({ x: pin1X - 50, y: pin2Y });
        } else {
            points.push({ x: pin2X - 50, y: pin1Y });
            points.push({ x: pin2X - 50, y: pin2Y });
        }
    } else if (pin1.side === "right" && pin2.side === "right") {
        if (pin1X > pin2X) {
            points.push({ x: pin1X + 50, y: pin1Y });
            points.push({ x: pin1X + 50, y: pin2Y });
        } else {
            points.push({ x: pin2X + 50, y: pin1Y });
            points.push({ x: pin2X + 50, y: pin2Y });
        }
    } else if (pin1.side === "top" && pin2.side === "bottom") {
        if (pin1Y > pin2Y) {
            points.push({ x: pin1X, y: (pin1Y + pin2Y) / 2 });
            points.push({ x: pin2X, y: (pin1Y + pin2Y) / 2 });
        } else {
            points.push({ x: pin1X, y: pin1Y - 50 });
            if (pin1X < pin2X) {
                points.push({ x: pin2X + 100, y: pin1Y - 50 });
                points.push({ x: pin2X + 100, y: pin2Y + 50 });
            } else {
                points.push({ x: pin2X - 100, y: pin1Y - 50 });
                points.push({ x: pin2X - 100, y: pin2Y + 50 });
            }
            points.push({ x: pin2X, y: pin2Y + 50 });
        }
    } else if (pin1.side === "bottom" && pin2.side === "top") {
        if (pin1Y < pin2Y) {
            points.push({ x: pin1X, y: (pin1Y + pin2Y) / 2 });
            points.push({ x: pin2X, y: (pin1Y + pin2Y) / 2 });
        } else {
            points.push({ x: pin1X, y: pin1Y + 50 });
            if (pin1X > pin2X) {
                points.push({ x: pin2X - 100, y: pin1Y + 50 });
                points.push({ x: pin2X - 100, y: pin2Y - 50 });
            } else {
                points.push({ x: pin2X + 100, y: pin1Y + 50 });
                points.push({ x: pin2X + 100, y: pin2Y - 50 });
            }
            points.push({ x: pin2X, y: pin2Y - 50 });
        }
    } else if (pin1.side === "left" && pin2.side === "right") {
        if (pin1X > pin2X) {
            points.push({ x: (pin1X + pin2X) / 2, y: pin1Y });
            points.push({ x: (pin1X + pin2X) / 2, y: pin2Y });
        } else {
            points.push({ x: pin1X - 100, y: pin1Y });
            if (pin1Y < pin2Y) {
                points.push({ x: pin1X - 100, y: pin2Y + 50 });
                points.push({ x: pin2X + 100, y: pin2Y + 50 });
            } else {
                points.push({ x: pin1X - 100, y: pin2Y - 50 });
                points.push({ x: pin2X + 100, y: pin2Y - 50 });
            }
            points.push({ x: pin2X + 100, y: pin2Y });
        }
    } else if (pin1.side === "right" && pin2.side === "left") {
        if (pin1X < pin2X) {
            points.push({ x: (pin1X + pin2X) / 2, y: pin1Y });
            points.push({ x: (pin1X + pin2X) / 2, y: pin2Y });
        } else {
            points.push({ x: pin1X + 100, y: pin1Y });
            if (pin1X > pin2X) {
                points.push({ x: pin1X + 100, y: pin2Y - 50 });
                points.push({ x: pin2X - 100, y: pin2Y - 50 });
            } else {
                points.push({ x: pin1X + 100, y: pin2Y + 50 });
                points.push({ x: pin2X - 100, y: pin2Y + 50 });
            }
            points.push({ x: pin2X - 100, y: pin2Y });
        }
    } else if (pin1.side === "top" && pin2.side === "left") {
        if (pin1Y > pin2Y) {
            if (pin1X < pin2X) {
                points.push({ x: pin1X, y: pin2Y });
            } else {
                points.push({ x: pin1X, y: pin2Y - 75 });
                points.push({ x: pin2X - 100, y: pin2Y - 75 });
                points.push({ x: pin2X - 100, y: pin2Y });
            }
        } else {
            points.push({ x: pin1X, y: pin1Y - 50 });
            if (pin1X < pin2X) {
                points.push({ x: pin1X - 100, y: pin1Y - 50 });
                points.push({ x: pin1X - 100, y: pin2Y });
            } else {
                points.push({ x: pin2X - 100, y: pin1Y - 50 });
                points.push({ x: pin2X - 100, y: pin2Y });
            }
        }
    } else if (pin1.side === "left" && pin2.side === "top") {
        if (pin1Y < pin2Y) {
            if (pin1X > pin2X) {
                points.push({ x: pin2X, y: pin1Y });
            } else {
                points.push({ x: pin1X - 100, y: pin1Y });
                points.push({ x: pin1X - 100, y: pin1Y - 75 });
                points.push({ x: pin2X, y: pin1Y - 75 });
            }
        } else {
            points.push({ x: pin1X, y: pin1Y + 50 });
            if (pin1X > pin2X) {
                points.push({ x: pin2X - 100, y: pin1Y });
                points.push({ x: pin2X - 100, y: pin2Y - 50 });
            } else {
                points.push({ x: pin1X - 100, y: pin1Y });
                points.push({ x: pin1X - 100, y: pin2Y - 50 });
            }
            points.push({ x: pin2X, y: pin2Y - 50 });
        }
    } else if (pin1.side === "top" && pin2.side === "right") {
        if (pin1Y > pin2Y) {
            if (pin1X > pin2X) {
                points.push({ x: pin1X, y: pin2Y });
            } else {
                points.push({ x: pin1X, y: pin2Y - 75 });
                points.push({ x: pin2X + 100, y: pin2Y - 75 });
                points.push({ x: pin2X + 100, y: pin2Y });
            }
        } else {
            points.push({ x: pin1X, y: pin1Y - 50 });
            if (pin1X < pin2X) {
                points.push({ x: pin2X + 100, y: pin1Y - 50 });
                points.push({ x: pin2X + 100, y: pin2Y });
            } else {
                points.push({ x: pin1X + 100, y: pin1Y - 50 });
                points.push({ x: pin1X + 100, y: pin2Y });
            }
        }
    } else if (pin1.side === "right" && pin2.side === "top") {
        if (pin1Y < pin2Y) {
            if (pin1X < pin2X) {
                points.push({ x: pin2X, y: pin1Y });
            } else {
                points.push({ x: pin1X + 100, y: pin1Y });
                points.push({ x: pin1X + 100, y: pin1Y - 75 });
                points.push({ x: pin2X, y: pin1Y - 75 });
            }
        } else {
            if (pin1X < pin2X) {
                points.push({ x: pin2X + 100, y: pin1Y });
                points.push({ x: pin2X + 100, y: pin2Y - 50 });
            } else {
                points.push({ x: pin1X + 100, y: pin1Y });
                points.push({ x: pin1X + 100, y: pin2Y - 50 });
            }
            points.push({ x: pin2X, y: pin2Y - 50 });
        }
    } else if (pin1.side === "bottom" && pin2.side === "left") {
        if (pin1Y < pin2Y) {
            if (pin1X < pin2X) {
                points.push({ x: pin1X, y: pin2Y });
            } else {
                points.push({ x: pin1X, y: pin2Y + 75 });
                points.push({ x: pin2X - 100, y: pin2Y + 75 });
                points.push({ x: pin2X - 100, y: pin2Y });
            }
        } else {
            points.push({ x: pin1X, y: pin1Y + 50 });
            if (pin1X < pin2X) {
                points.push({ x: pin1X - 100, y: pin1Y + 50 });
                points.push({ x: pin1X - 100, y: pin2Y });
            } else {
                points.push({ x: pin2X - 100, y: pin1Y + 50 });
                points.push({ x: pin2X - 100, y: pin2Y });
            }
        }
    } else if (pin1.side === "left" && pin2.side === "bottom") {
        if (pin1Y > pin2Y) {
            if (pin1X > pin2X) {
                points.push({ x: pin2X, y: pin1Y });
            } else {
                points.push({ x: pin1X - 100, y: pin1Y });
                points.push({ x: pin1X - 100, y: pin1Y + 75 });
                points.push({ x: pin2X, y: pin1Y + 75 });
            }
        } else {
            if (pin1X > pin2X) {
                points.push({ x: pin2X - 100, y: pin1Y });
                points.push({ x: pin2X - 100, y: pin2Y + 50 });
            } else {
                points.push({ x: pin1X - 100, y: pin1Y });
                points.push({ x: pin1X - 100, y: pin2Y + 50 });
            }
            points.push({ x: pin2X, y: pin2Y + 50 });
        }
    } else if (pin1.side === "bottom" && pin2.side === "right") {
        if (pin1Y < pin2Y) {
            if (pin1X > pin2X) {
                points.push({ x: pin1X, y: pin2Y });
            } else {
                points.push({ x: pin1X, y: pin2Y + 75 });
                points.push({ x: pin2X + 100, y: pin2Y + 75 });
                points.push({ x: pin2X + 100, y: pin2Y });
            }
        } else {
            points.push({ x: pin1X, y: pin1Y + 50 });
            if (pin1X < pin2X) {
                points.push({ x: pin2X + 100, y: pin1Y + 50 });
                points.push({ x: pin2X + 100, y: pin2Y });
            } else {
                points.push({ x: pin1X + 100, y: pin1Y + 50 });
                points.push({ x: pin1X + 100, y: pin2Y });
            }
        }
    } else if (pin1.side === "right" && pin2.side === "bottom") {
        if (pin1Y > pin2Y) {
            if (pin1X < pin2X) {
                points.push({ x: pin2X, y: pin1Y });
            } else {
                points.push({ x: pin1X + 100, y: pin1Y });
                points.push({ x: pin1X + 100, y: pin1Y + 75 });
                points.push({ x: pin2X, y: pin1Y + 75 });
            }
        } else {
            if (pin1X < pin2X) {
                points.push({ x: pin2X + 100, y: pin1Y });
                points.push({ x: pin2X + 100, y: pin2Y + 50 });
            } else {
                points.push({ x: pin1X + 100, y: pin1Y });
                points.push({ x: pin1X + 100, y: pin2Y + 50 });
            }
            points.push({ x: pin2X, y: pin2Y + 50 });
        }
    }

    points.push({ x: pin2X, y: pin2Y });
    return points;
}