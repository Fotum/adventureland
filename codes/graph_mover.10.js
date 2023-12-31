const GRAPH_RESOLUTION = 10;

class Box {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }

    square() {
        let width = this.width();
        let height = this.height();
        let difference = Math.abs(height - width) / 2;

        if (width < height) {
            this.x1 -= difference;
            this.x2 += difference;
        } else {
            this.y1 -= difference;
            this.y2 += difference;
        }
    }

    width() {
        return this.x2 - this.x1;
    }

    height() {
        return this.y2 - this.y1;
    }

    contains(x, y) {
        // Added equalty sign for case when characters stands directrly at the centre
        return (this.x1 <= x && x <= this.x2 &&
                this.y1 <= y && y <= this.y2);
    }

    intersects(box) {
        return (this.x1 <= box.x2 &&
                box.x1 <= this.x2 &&
                this.y1 <= box.y2 &&
                box.y1 <= this.y2);
    }

    intersects_segment(ox, oy, invdx, invdy) {
        let t1 = (this.x1 - ox) * invdx;
        let t2 = (this.x2 - ox) * invdx;
        let t3 = (this.y1 - oy) * invdy;
        let t4 = (this.y2 - oy) * invdy;

        let tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4));
        let tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4));

        if (tmax < 0) return false;
        if (tmax > 1 || tmin > tmax) return false;

        return true;
    }

    drawBoxLines() {
        let width = this.width();
        let height = this.height();
        let difference = Math.abs(height - width) / 2;

        let x1 = this.x1 - difference;
        let x2 = this.x2 + difference;

        let y1 = this.y1 - difference;
        let y2 = this.y2 + difference;

        draw_line(x1, y1, x2, y1, 1, 0xFFFF00);
        draw_line(x2, y1, x2, y2, 1, 0xFFFF00);
        draw_line(x2, y2, x1, y2, 1, 0xFFFF00);
        draw_line(x1, y2, x1, y1, 1, 0xFFFF00);
    }
}

class NodeTree {
    constructor(region, obstacles, parent, nodeIx) {
        if (parent) {
            this.parent = parent;
        } else {
            this.parent = null;
        }

        // Represents and index of this node relative to parent
        // NW - 00, NE - 01, SW - 10, SE - 11
        this.index = nodeIx;
        // Square representing current region
        this.region = region;

        // Coords of region's centre
        this.x = (region.x1 + region.x2) / 2;
        this.y = (region.y1 + region.y2) / 2;

        // Subregions
        this.children = [];
        // Adjacent nodes
        this.connections = [];
        // Obstacles inside this node
        this.obstacles = obstacles;

        // Is region was connected or not
        this.isConnected = false;
        // This region is crossable or not
        this.isCrossable = this.obstacles.length === 0;
        // This node is a leaf or not
        this.isLeaf = this.isCrossable || this.region.width() <= GRAPH_RESOLUTION;

        this.subdivide();
    }

    subdivide() {
        if (this.isLeaf) {
            return;
        }

        let l = this.region.x1;
        let r = this.region.x2;
        let t = this.region.y1;
        let b = this.region.y2;

        let x = this.x;
        let y = this.y;

        let subregions = [
            new Box(l, t, x, y), // 0 - 00 NW
            new Box(x, t, r, y), // 1 - 01 NE
            new Box(l, y, x, b), // 2 - 10 SW
            new Box(x, y, r, b), // 3 - 11 SE
        ];

        for (let i = 0; i < subregions.length; i++) {
            let subregion = subregions[i];
            let subObstacles = [];

            for (let obstacle of this.obstacles) {
                if (subregion.intersects(obstacle)) {
                    subObstacles.push(obstacle);
                }
            }

            this.children[i] = new NodeTree(subregion, subObstacles, this, i);
        }
    }

    getGreaterOrEqualSizeConnections(direction) {
        // Straight Directions: N, E, S, W
        // Diagonal Directions: NW, NE, SE, SW
        // Reached root of the tree
        if (this.parent == this) {
            return null;
        }

        // This node is NW child of it's parent
        if (this.index === 0) {
            if (direction === "E") {
                return this.parent.children[1];
            } else if (direction === "S") {
                return this.parent.children[2];
            } else if (direction === "SE") {
                return this.parent.children[3];
            } else if (direction === "N" || direction === "W") {
                let node = this.parent.getGreaterOrEqualSizeConnections(direction);
                if (!node || node.isLeaf) {
                    return node;
                }

                if (direction === "N") {
                    return node.children[2];
                } else if (direction === "W") {
                    return node.children[1];
                }
            } else if (direction === "SW" || direction === "NW" || direction === "NE") {
                let node = undefined;
                if (direction === "SW") {
                    node = this.parent.getGreaterOrEqualSizeConnections("W");
                } else if (direction === "NW") {
                    node = this.parent.getGreaterOrEqualSizeConnections(direction);
                } else if (direction === "NE") {
                    node = this.parent.getGreaterOrEqualSizeConnections("N");
                }

                if (!node || node.isLeaf) {
                    return node;
                }

                return node.children[3];
            }
        }
        // This node is NE child of it's parent
        else if (this.index === 1) {
            if (direction === "S") {
                return this.parent.children[3];
            } else if (direction === "W") {
                return this.parent.children[0];
            } else if (direction === "SW") {
                return this.parent.children[2];
            } else if (direction === "N" || direction === "E") {
                let node = this.parent.getGreaterOrEqualSizeConnections(direction);
                if (!node || node.isLeaf) {
                    return node;
                }

                if (direction === "N") {
                    return node.children[3];
                } else if (direction === "E") {
                    return node.children[0];
                }
            } else if (direction === "NW" || direction === "NE" || direction === "SE") {
                let node = undefined;
                if (direction === "NW") {
                    node = this.parent.getGreaterOrEqualSizeConnections("N");
                } else if (direction === "NE") {
                    node = this.parent.getGreaterOrEqualSizeConnections(direction);
                } else if (direction === "SE") {
                    node = this.parent.getGreaterOrEqualSizeConnections("E");
                }

                if (!node || node.isLeaf) {
                    return node;
                }

                return node.children[2];
            }
        }
        // This node is SW child of it's parent
        else if (this.index === 2) {
            if (direction === "N") {
                return this.parent.children[0];
            } else if (direction === "E") {
                return this.parent.children[3];
            } else if (direction === "NE") {
                return this.parent.children[1];
            } else if (direction === "S" || direction === "W") {
                let node = this.parent.getGreaterOrEqualSizeConnections(direction);
                if (!node || node.isLeaf) {
                    return node;
                }

                if (direction === "S") {
                    return node.children[0];
                } else if (direction === "W") {
                    return node.children[3];
                }
            } else if (direction === "SE" || direction === "SW" || direction === "NW") {
                let node = undefined;
                if (direction === "SE") {
                    node = this.parent.getGreaterOrEqualSizeConnections("S");
                } else if (direction === "SW") {
                    node = this.parent.getGreaterOrEqualSizeConnections(direction);
                } else if (direction === "NW") {
                    node = this.parent.getGreaterOrEqualSizeConnections("W");
                }

                if (!node || node.isLeaf) {
                    return node;
                }

                return node.children[1];
            }
        }
        // This node is SE child of it's parent
        else if (this.index === 3) {
            if (direction === "N") {
                return this.parent.children[1];
            } else if (direction === "W") {
                return this.parent.children[2];
            } else if (direction === "NW") {
                return this.parent.children[0];
            } else if (direction === "E" || direction === "S") {
                let node = this.parent.getGreaterOrEqualSizeConnections(direction);
                if (!node || node.isLeaf) {
                    return node;
                }

                if (direction === "E") {
                    return node.children[2];
                } else if (direction === "S") {
                    return node.children[1];
                } else if (direction === "SE") {
                    return node.children[0];
                }
            } else if (direction === "NE" || direction === "SE" || direction === "SW") {
                let node = undefined;
                if (direction === "NE") {
                    node = this.parent.getGreaterOrEqualSizeConnections("E");
                } else if (direction === "SE") {
                    node = this.parent.getGreaterOrEqualSizeConnections(direction);
                } else if (direction === "SW") {
                    node = this.parent.getGreaterOrEqualSizeConnections("S");
                }

                if (!node || node.isLeaf) {
                    return node;
                }

                return node.children[0];
            }
        }

        return null;
    }

    getSmallerSizeConnections(connection, direction) {
        let candidates = [];
        let connections = [];

        if (connection) {
            candidates.push(connection);
        }

        while (candidates.length > 0) {
            let zeroCandidate = candidates.shift(candidates[0]);
            if (zeroCandidate.isLeaf) {
                connections.push(zeroCandidate);
            } else {
                if (direction === "N") {
                    candidates.push(zeroCandidate.children[2]);
                    candidates.push(zeroCandidate.children[3]);
                } else if (direction === "E") {
                    candidates.push(zeroCandidate.children[0]);
                    candidates.push(zeroCandidate.children[2]);
                } else if (direction === "S") {
                    candidates.push(zeroCandidate.children[0]);
                    candidates.push(zeroCandidate.children[1]);
                } else if (direction === "W") {
                    candidates.push(zeroCandidate.children[1]);
                    candidates.push(zeroCandidate.children[3]);
                } else if (direction === "NE") {
                    candidates.push(zeroCandidate.children[2]);
                } else if (direction === "SE") {
                    candidates.push(zeroCandidate.children[0]);
                } else if (direction === "SW") {
                    candidates.push(zeroCandidate.children[1]);
                } else if (direction === "NW") {
                    candidates.push(zeroCandidate.children[3]);
                }
            }
        }

        return connections.filter((n) => n.isCrossable);
    }

    establishConnections() {
        if (!this.isLeaf || !this.isCrossable) {
            return [];
        }

        if (this.isConnected) {
            return this.connections;
        }

        let directions = ["N", "E", "S", "W"];
        let tmpConnections = [];
        for (let direction of directions) {
            let greaterOrEqual = this.getGreaterOrEqualSizeConnections(direction);
            let smaller = this.getSmallerSizeConnections(greaterOrEqual, direction);

            tmpConnections = tmpConnections.concat(smaller);
        }

        this.isConnected = true;
        this.connections = tmpConnections;

        return this.connections;
    }

    initConnections() {
        // Initialize connections only for crossable leaf nodes which are not already connected
        if (!this.isLeaf || !this.isCrossable || this.isConnected) {
            return;
        }

        // #TODO For debug purposes
        // this.region.drawBoxLines();
        let connections = this.establishConnections();
        for (let conn of connections) {
            if (!conn.isConnected) {
                conn.initConnections();
            }
        }
    }

    getRegionOfPoint(x, y) {
        if (!this.region.contains(x, y)) {
            return null;
        }

        if (this.isLeaf) {
            return this;
        }

        return this.getQuad(x, y).getRegionOfPoint(x, y);
    }

    getQuad(x, y) {
        if (this.children.length === 0) {
            return this;
        }

        if (x < this.x && y < this.y) return this.children[0];
        else if (x >= this.x && y < this.y) return this.children[1];
        else if (x < this.x && y >= this.y) return this.children[2];
        return this.children[3];
    }

    getContaining(a, b) {
        // Acquiring nodes for both pair of coordinates
        let a_quad = this.getQuad(a.x, a.y);
        let b_quad = this.getQuad(b.x, b.y);

        // If a = b, check children
        if (a_quad == b_quad) {
            return a_quad.getContaining(a, b);
        }

        return this;
    }

    hasConnection(node) {
        if (!node || this.connections.length === 0) {
            return false;
        }

        return this.connections.includes(node);
    }
}

function initializeGraphGlobal(mapName) {
    let mapData = parent.G.maps[mapName].data;

    let min_x = Infinity;
    let max_x = -Infinity;
    let min_y = Infinity;
    let max_y = -Infinity;

    let obstacles = [];

    for (let line of mapData.x_lines) {
        min_x = Math.min(min_x, line[0]);
        max_x = Math.max(max_x, line[0]);

        obstacles.push(new Box(
            line[0] - 1,
            Math.min(line[1], line[2]) - 1,
            line[0] + 1,
            Math.max(line[1], line[2]) + 5
        ));
    }

    for (let line of mapData.y_lines) {
        min_y = Math.min(min_y, line[0]);
        max_y = Math.max(max_y, line[0]);

        obstacles.push(new Box(
            Math.min(line[1], line[2]) - 1,
            line[0] - 1,
            Math.max(line[1], line[2]) + 1,
            line[0] + 5
        ));
    }
    
    let bx = new Box(min_x, min_y, max_x, max_y);
    bx.square();

    let grid = new NodeTree(bx, obstacles);
    let connInitNode = grid.getRegionOfPoint(character.real_x, character.real_y);
    connInitNode.initConnections();

    return grid;
}

function initializeGraphLocal(a, b) {
    let mapData = parent.G.maps[character.map].data;

    let obstacles = [];

    for (let line of mapData.x_lines) {
        obstacles.push(new Box(
            line[0] - 1,
            Math.min(line[1], line[2]) - 1,
            line[0] + 1,
            Math.max(line[1], line[2]) + 5
        ));
    }

    for (let line of mapData.y_lines) {
        obstacles.push(new Box(
            Math.min(line[1], line[2]) - 1,
            line[0] - 1,
            Math.max(line[1], line[2]) + 1,
            line[0] + 5
        ));
    }

    let x1 = a.x;
    let y1 = a.y;
    let x2 = b.x;
    let y2 = b.y;
    
    let bx = new Box(x1, y1, x2, y2);
    bx.square();

    return new NodeTree(bx, obstacles);
}

function reducePath(path) {
    if (!path) {
        return [];
    }

    let reduced = [];
    reduced.push(path[0]);

    let sameCnt = 0;
    let prevNode = path[0];
    for (let node of path) {
        let changedX = false;
        let changedY = false;
        
        // Checking X
        if (node.x != prevNode.x) {
            changedX = true;
        }

        // Checking Y
        if (node.y != prevNode.y) {
            changedY = true;
        }

        if (changedX && changedY) {
            reduced.push(node);
        } else if (changedX) {
            reduced.push([prevNode]);
            reduced.push(node);
        }

        let needPush = sameCnt > 1;
        if (needPush) {
            reduced.push(prevNode);
            reduced.push(node);
            sameCnt = 0;
        }

        prevNode = node;
        sameCnt++;
    }

    return reduced;
}

function plotPath(startNode, endNode) {
    // Not yet travelled nodes
    let openNodes = new Set();
    // Already travelled nodes
    let closedNodes = new Set();

    // Map to track our traveled path
    let traveled = new Map();
    // Map to track distance between nodes
    let heuristic = new Map();
    // Map to track parents of nodes (parent is from where did we come to current node)
    let parents = new Map();

    // Adding start point as initial
    openNodes.add(startNode);

    traveled.set(startNode, 0);
    heuristic.set(startNode, simple_distance(startNode, endNode));
    parents.set(startNode, startNode);

    while (openNodes.size) {
        let currNode = null;
        let minHeuristic = Infinity;

        for (let open of openNodes) {
            let nodeHeuristic = heuristic.get(open);
            if (nodeHeuristic < minHeuristic) {
                minHeuristic = nodeHeuristic;
                currNode = open;
            }
        }

        if (currNode == endNode) {
            break;
        }

        // Remove current from open nodes
        openNodes.delete(currNode);
        // Add current to closed nodes
        closedNodes.add(currNode);

        let connections = currNode.connections;
        for (let conn of connections) {
            if (closedNodes.has(conn)) {
                continue;
            }

            let oldPath = traveled.get(conn);
            if (!openNodes.has(conn)) {
                oldPath = Infinity;
                openNodes.add(conn);
            }

            // From where did we come to the current node
            let parent = parents.get(currNode);
            if (parent.hasConnection(conn)) {
                // Check if we can come to this connection from parent node
                let parentPath = traveled.get(parent) + simple_distance(parent, conn);
                if (parentPath < oldPath) {
                    parents.set(conn, parent);
                    traveled.set(conn, parentPath);
                    heuristic.set(conn, parentPath + simple_distance(conn, endNode));
                }
            } else {
                let newPath = traveled.get(currNode) + simple_distance(currNode, conn);
                if (newPath < oldPath) {
                    parents.set(conn, currNode);
                    traveled.set(conn, newPath);
                    heuristic.set(conn, newPath + simple_distance(conn, endNode));
                }
            }
        }
    }

    // Just in case check if we've found the path to target
    if (!parents.has(endNode)) {
        return [];
    }

    let path = [];
    let current = endNode;
    while (current && current != startNode) {
        let pathNode = {x: current.x, y: current.y};
        path.unshift(pathNode);
        current = parents.get(current);
    }

    // console.log(path);
    // console.log(reducePath(path));
    return path;
}

function plotPathLocal(gridSize, source, target) {
    if (!gridSize || !source || !target) {
        return [];
    }

    let dp1 = {x: character.real_x - gridSize / 2, y: character.real_y - gridSize / 2};
    let dp2 = {x: character.real_x + gridSize / 2, y: character.real_y + gridSize / 2};

    // Initialize graph, starting point and end point
    let grid = initializeGraphLocal(dp1, dp2);
    let startNode = grid.getRegionOfPoint(source.x, source.y);
    let endNode = grid.getRegionOfPoint(target.x, target.y);

    // If both start and end nodes are not found within graph -> return
    if (!startNode || !endNode) {
        console.log("Unreachable target or start position is invalid");
        return [];
    }

    // If startNode was not crossable - mark it as crossable because we are standing on it
    if (!startNode.isCrossable) {
        startNode.isCrossable = true;
    }

    // Init connections within graph
    startNode.initConnections();

    // If endNode was not connected then target is unreachable
    if (!endNode.isConnected) {
        console.log("Unreachable target");
        return [];
    }

    let path = plotPath(startNode, endNode);
    // Replace final step with step to target directly
    path.splice(path.length - 1, 1, target);

    return path;
}

function plotPathGlobal(source, target) {
    if (!source || !target) {
        return [];
    }

    let startNode = MAP_GRAPH.getRegionOfPoint(source.x, source.y);
    let endNode = MAP_GRAPH.getRegionOfPoint(target.x, target.y);

    // If both start and end nodes are not found within graph -> return
    if (!startNode || !endNode) {
        console.log("Unreachable target or start position is invalid");
        return [];
    }

    // If endNode was not connected then target is unreachable
    if (!endNode.isConnected) {
        console.log("Unreachable target");
        return [];
    }

    // If startNode was not crossable - mark it as crossable because we are standing on it
    let oldCrossable = startNode.isCrossable;
    if (!oldCrossable) {
        startNode.isCrossable = true;
        // Init connections for start node (because it might be not crossable before, so no connections within graph)
        startNode.establishConnections();
    }

    let path = plotPath(startNode, endNode);
    path.splice(path.length - 1, 1, target);

    if (!oldCrossable) {
        startNode.isCrossable = false;
        startNode.connections = [];
    }

    return path;
}

async function moveTo(to) {
    let from = {x: character.real_x, y: character.real_y};
    let path = plotPathGlobal(from, to);

    for (let node of path) {
        await move(node.x, node.y);
    }
}