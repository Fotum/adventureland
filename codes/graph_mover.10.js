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
        return (this.x1 < x && x < this.x2 &&
                this.y1 < y && y < this.y2);
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
        draw_line(this.x1, this.y1, this.x2, this.y1, 1, 0xFFFF00);
        draw_line(this.x2, this.y1, this.x2, this.y2, 1, 0xFFFF00);
        draw_line(this.x2, this.y2, this.x1, this.y2, 1, 0xFFFF00);
        draw_line(this.x1, this.y2, this.x1, this.y1, 1, 0xFFFF00);
    }
}

class NodeTree {
    constructor(region, obstacles, root) {
        if (root) {
            this.root = root;
        } else {
            this.root = this;
        }

        this.region = region;

        this.x = (region.x1 + region.x2) / 2;
        this.y = (region.y1 + region.y2) / 2;

        this.obstacles = obstacles;
        this.subdivided = false;

        this.is_leaf = false;
        this.crossable = true;

        if (region.width() <= GRAPH_RESOLUTION) {
            this.is_leaf = true;
            this.crossable = obstacles.length == 0;
        }

        this.quads = [];
        this.nodes = [];

        this.neighbors = null;
    }

    get_quad(x, y) {
        if (x < this.x && y < this.y) return this.quads[0];
        else if (x >= this.x && y < this.y) return this.quads[1];
        else if (x < this.x && y >= this.y) return this.quads[2];
        return this.quads[3];
    }

    subdivide() {
        this.subdivided = true;

        let l = this.region.x1;
        let r = this.region.x2;
        let t = this.region.y1;
        let b = this.region.y2;

        let x = this.x;
        let y = this.y;

        let subregions = [
            new Box(l, t, x, y),
            new Box(x, t, r, y),
            new Box(l, y, x, b),
            new Box(x, y, r, b),
        ];

        for (let i = 0; i < subregions.length; i++) {
            let subregion = subregions[i];
            let subregion_obstacles = [];

            for (let obstacle of this.obstacles) {
                if (subregion.intersects(obstacle)) {
                    subregion_obstacles.push(obstacle);
                }
            }

            this.quads[i] = new NodeTree(subregion, subregion_obstacles, this.root);
        }
    }

    get(x, y) {
        if (!this.region.contains(x, y)) return null;
        if (!this.crossable || this.is_leaf) return this;

        if (!this.subdivided) {
            this.subdivide();
        }

        return this.get_quad(x, y).get(x, y);
    }

    get_neighbors() {
        if (!this.is_leaf) throw new Error('Tried getting neighbors of non-leaf node');
        if (this.neighbors) return this.neighbors;

        this.neighbors = [];

        let x = this.x;
        let y = this.y;
        let width = this.region.width();
        let height = this.region.height();

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i == 0 && j == 0) continue;

                let neighbor = this.root.get(x + width * i, y + height * j);
                if (neighbor && neighbor.crossable) {
                    this.neighbors.push(neighbor);
                }
            }
        }

        return this.neighbors;
    }

    get_containing(a, b) {
        let a_quad = this.get_quad(a.x, a.y);
        let b_quad = this.get_quad(b.x, b.y);

        if (a_quad == b_quad) return a_quad.get_containing(a, b);

        return this;
    }

    has_sight(node) {
        let ancestor = this.root.get_containing(this, node);

        let invdx = 1 / (node.x - this.x);
        let invdy = 1 / (node.y - this.y);

        for (let obstacle of ancestor.obstacles) {
            if (obstacle.intersects_segment(this.x, this.y, invdx, invdy)) {
                return false;
            }
        }

        return true;
    }
}

function distance(a, b) {
    let x_dist = b.x - a.x;
    let y_dist = b.y - a.y;
    return Math.sqrt(x_dist * x_dist + y_dist * y_dist);
}

function find_path(source, target) {
    let closed = new Set();
    let open = new Set();

    let traveled = new Map();
    let heuristic = new Map();
    let parents = new Map();

    open.add(source);

    traveled.set(source, 0);
    heuristic.set(source, distance(source, target));
    parents.set(source, source);

    while (open.size) {
        let current = null;
        let min_heuristic = Infinity;

        for (let node of open) {
            let node_heuristic = heuristic.get(node);

            if (node_heuristic < min_heuristic) {
                min_heuristic = node_heuristic;
                current = node;
            }
        }

        if (current == target) {
            break;
        }

        open.delete(current);
        closed.add(current);

        for (let neighbor of current.get_neighbors()) {
            if (closed.has(neighbor)) continue;

            let old_path = traveled.get(neighbor);
            if (!open.has(neighbor)) {
                old_path = Infinity;
                open.add(neighbor);
            }

            let parent = parents.get(current);
            if (parent.has_sight(neighbor)) {
                let parent_path = traveled.get(parent) + distance(parent, neighbor);
                if (parent_path < old_path) {
                    parents.set(neighbor, parent);
                    traveled.set(neighbor, parent_path);
                    heuristic.set(neighbor, parent_path + distance(neighbor, target));
                }
            } else {
                let new_path = traveled.get(current) + distance(current, neighbor);
                if (new_path < old_path) {
                    parents.set(neighbor, current);
                    traveled.set(neighbor, new_path);
                    heuristic.set(neighbor, new_path + distance(neighbor, target));
                }
            }
        }
    }

    if (!parents.has(target)) return [];

    let path = [];
    let current = target;
    while (current && current != source) {
        path.unshift(current);
        current = parents.get(current);
    }

    return path;
}

function initialize_graph(map_name) {
    let map_data = parent.G.maps[map_name].data;

    let min_x = Infinity;
    let max_x = -Infinity;
    let min_y = Infinity;
    let max_y = -Infinity;

    let obstacles = [];

    for (let line of map_data.x_lines) {
        min_x = Math.min(min_x, line[0]);
        max_x = Math.max(max_x, line[0]);
        // obstacles.push(new Box(
        //     line[0] - 3,
        //     Math.min(line[1], line[2]) - 3,
        //     line[0] + 3,
        //     Math.max(line[1], line[2]) + 7
        // ));
        obstacles.push(new Box(
            line[0] - 5,
            Math.min(line[1], line[2]) - 5,
            line[0] + 5,
            Math.max(line[1], line[2]) + 9
        ));
    }

    for (let line of map_data.y_lines) {
        min_y = Math.min(min_y, line[0]);
        max_y = Math.max(max_y, line[0]);
        // obstacles.push(new Box(
        //     Math.min(line[1], line[2]) - 3,
        //     line[0] - 3,
        //     Math.max(line[1], line[2]) + 3,
        //     line[0] + 7
        // ));
        obstacles.push(new Box(
            Math.min(line[1], line[2]) - 5,
            line[0] - 5,
            Math.max(line[1], line[2]) + 5,
            line[0] + 9
        ));
    }

    let region = new Box(min_x, min_y, max_x, max_y);
    region.square();

    return new NodeTree(region, obstacles);
}

function getPathPlotted(from, to) {
    let nodeStart = MAP_GRAPH.get(from.x, from.y);
    let nodeFinish = MAP_GRAPH.get(to.x, to.y);

    let path = find_path(nodeStart, nodeFinish);
    let pathPlot = path.map(
        (n) => {return {x: n.x, y: n.y}}
    );
    
    return pathPlot;
}

async function moveTo(to) {
    let from = {x: character.real_x, y: character.real_y};
    let path = getPathPlotted(from, to);

    for (let node of path) {
        let x = node.x;
        let y = node.y;

        await move(x, y);
    }
}