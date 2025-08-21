function memset(mem, C, L) {
    var i = 0;
    for (; i < L; ++i) {
        mem[i] = C;
    }
}

function hex(n, w) {
    var s = n.toString(16);
    if (w) {
        while (s.length < w) {
            s = '0' + s;
        }
    }
    return s;
}

function hex8(n) {
    return hex(n, 2);
}

function hex16(n) {
    return hex(n, 4);
}

function hex32(n) {
    return hex(n, 8);
}

function mmu_watch_invalid(mmu, address) {
    return;
}
