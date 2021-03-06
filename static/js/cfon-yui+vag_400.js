/*
 * Copyright (c) 2009 Simo Kinnunen.
 * Licensed under the MIT license.
 *
 * @version 1.02
 */
var Cufon = (function() {
    var m = function() {
        return m.replace.apply(null, arguments)
    };
    var x = m.DOM = {ready:(function() {
        var C = false,E = {loaded:1,complete:1};
        var B = [],D = function() {
            if (C) {
                return
            }
            C = true;
            for (var F; F = B.shift(); F()) {
            }
        };
        if (document.addEventListener) {
            document.addEventListener("DOMContentLoaded", D, false);
            window.addEventListener("pageshow", D, false)
        }
        if (!window.opera && document.readyState) {
            (function() {
                E[document.readyState] ? D() : setTimeout(arguments.callee, 10)
            })()
        }
        if (document.readyState && document.createStyleSheet) {
            (function() {
                try {
                    document.body.doScroll("left");
                    D()
                } catch(F) {
                    setTimeout(arguments.callee, 1)
                }
            })()
        }
        q(window, "load", D);
        return function(F) {
            if (!arguments.length) {
                D()
            } else {
                C ? F() : B.push(F)
            }
        }
    })(),root:function() {
        return document.documentElement || document.body
    }};
    var n = m.CSS = {Size:function(C, B) {
        this.value = parseFloat(C);
        this.unit = String(C).match(/[a-z%]*$/)[0] || "px";
        this.convert = function(D) {
            return D / B * this.value
        };
        this.convertFrom = function(D) {
            return D / this.value * B
        };
        this.toString = function() {
            return this.value + this.unit
        }
    },addClass:function(C, B) {
        var D = C.className;
        C.className = D + (D && " ") + B;
        return C
    },color:j(function(C) {
        var B = {};
        B.color = C.replace(/^rgba\((.*?),\s*([\d.]+)\)/, function(E, D, F) {
            B.opacity = parseFloat(F);
            return"rgb(" + D + ")"
        });
        return B
    }),fontStretch:j(function(B) {
        if (typeof B == "number") {
            return B
        }
        if (/%$/.test(B)) {
            return parseFloat(B) / 100
        }
        return{"ultra-condensed":0.5,"extra-condensed":0.625,condensed:0.75,"semi-condensed":0.875,"semi-expanded":1.125,expanded:1.25,"extra-expanded":1.5,"ultra-expanded":2}[B] || 1
    }),getStyle:function(C) {
        var B = document.defaultView;
        if (B && B.getComputedStyle) {
            return new a(B.getComputedStyle(C, null))
        }
        if (C.currentStyle) {
            return new a(C.currentStyle)
        }
        return new a(C.style)
    },gradient:j(function(F) {
        var G = {id:F,type:F.match(/^-([a-z]+)-gradient\(/)[1],stops:[]},C = F.substr(F.indexOf("(")).match(/([\d.]+=)?(#[a-f0-9]+|[a-z]+\(.*?\)|[a-z]+)/ig);
        for (var E = 0,B = C.length,D; E < B; ++E) {
            D = C[E].split("=", 2).reverse();
            G.stops.push([D[1] || E / (B - 1),D[0]])
        }
        return G
    }),hasClass:function(C, B) {
        return RegExp("(?:^|\\s)" + B + "(?=\\s|$)").test(C.className)
    },quotedList:j(function(E) {
        var D = [],C = /\s*((["'])([\s\S]*?[^\\])\2|[^,]+)\s*/g,B;
        while (B = C.exec(E)) {
            D.push(B[3] || B[1])
        }
        return D
    }),recognizesMedia:j(function(G) {
        var E = document.createElement("style"),D,C,B;
        E.type = "text/css";
        E.media = G;
        try {
            E.appendChild(document.createTextNode("/**/"))
        } catch(F) {
        }
        C = g("head")[0];
        C.insertBefore(E, C.firstChild);
        D = (E.sheet || E.styleSheet);
        B = D && !D.disabled;
        C.removeChild(E);
        return B
    }),removeClass:function(D, C) {
        var B = RegExp("(?:^|\\s+)" + C + "(?=\\s|$)", "g");
        D.className = D.className.replace(B, "");
        return D
    },supports:function(D, C) {
        var B = document.createElement("span").style;
        if (B[D] === undefined) {
            return false
        }
        B[D] = C;
        return B[D] === C
    },textAlign:function(E, D, B, C) {
        if (D.get("textAlign") == "right") {
            if (B > 0) {
                E = " " + E
            }
        } else {
            if (B < C - 1) {
                E += " "
            }
        }
        return E
    },textDecoration:function(G, F) {
        if (!F) {
            F = this.getStyle(G)
        }
        var C = {underline:null,overline:null,"line-through":null};
        for (var B = G; B.parentNode && B.parentNode.nodeType == 1;) {
            var E = true;
            for (var D in C) {
                if (!k(C, D) || C[D]) {
                    continue
                }
                if (F.get("textDecoration").indexOf(D) != -1) {
                    C[D] = F.get("color")
                }
                E = false
            }
            if (E) {
                break
            }
            F = this.getStyle(B = B.parentNode)
        }
        return C
    },textShadow:j(function(F) {
        if (F == "none") {
            return null
        }
        var E = [],G = {},B,C = 0;
        var D = /(#[a-f0-9]+|[a-z]+\(.*?\)|[a-z]+)|(-?[\d.]+[a-z%]*)|,/ig;
        while (B = D.exec(F)) {
            if (B[0] == ",") {
                E.push(G);
                G = {};
                C = 0
            } else {
                if (B[1]) {
                    G.color = B[1]
                } else {
                    G[["offX","offY","blur"][C++]] = B[2]
                }
            }
        }
        E.push(G);
        return E
    }),textTransform:(function() {
        var B = {uppercase:function(C) {
            return C.toUpperCase()
        },lowercase:function(C) {
            return C.toLowerCase()
        },capitalize:function(C) {
            return C.replace(/\b./g, function(D) {
                return D.toUpperCase()
            })
        }};
        return function(E, D) {
            var C = B[D.get("textTransform")];
            return C ? C(E) : E
        }
    })(),whiteSpace:(function() {
        var B = {inline:1,"inline-block":1,"run-in":1};
        return function(E, C, D) {
            if (B[C.get("display")]) {
                return E
            }
            if (!D.previousSibling) {
                E = E.replace(/^\s+/, "")
            }
            if (!D.nextSibling) {
                E = E.replace(/\s+$/, "")
            }
            return E
        }
    })()};
    n.ready = (function() {
        var B = !n.recognizesMedia("all"),E = false;
        var D = [],H = function() {
            B = true;
            for (var K; K = D.shift(); K()) {
            }
        };
        var I = g("link"),J = g("style");

        function C(K) {
            return K.disabled || G(K.sheet, K.media || "screen")
        }

        function G(M, P) {
            if (!n.recognizesMedia(P || "all")) {
                return true
            }
            if (!M || M.disabled) {
                return false
            }
            try {
                var Q = M.cssRules,O;
                if (Q) {
                    search:for (var L = 0,K = Q.length; O = Q[L],L < K; ++L) {
                        switch (O.type) {case 2:break;case 3:if (!G(O.styleSheet, O.media.mediaText)) {
                            return false
                        }break;default:break search
                        }
                    }
                }
            } catch(N) {
            }
            return true
        }

        function F() {
            if (document.createStyleSheet) {
                return true
            }
            var L,K;
            for (K = 0; L = I[K]; ++K) {
                if (L.rel.toLowerCase() == "stylesheet" && !C(L)) {
                    return false
                }
            }
            for (K = 0; L = J[K]; ++K) {
                if (!C(L)) {
                    return false
                }
            }
            return true
        }

        x.ready(function() {
            if (!E) {
                E = n.getStyle(document.body).isUsable()
            }
            if (B || (E && F())) {
                H()
            } else {
                setTimeout(arguments.callee, 10)
            }
        });
        return function(K) {
            if (B) {
                K()
            } else {
                D.push(K)
            }
        }
    })();
    function s(C) {
        var B = this.face = C.face;
        this.glyphs = C.glyphs;
        this.w = C.w;
        this.baseSize = parseInt(B["units-per-em"], 10);
        this.family = B["font-family"].toLowerCase();
        this.weight = B["font-weight"];
        this.style = B["font-style"] || "normal";
        this.viewBox = (function() {
            var E = B.bbox.split(/\s+/);
            var D = {minX:parseInt(E[0], 10),minY:parseInt(E[1], 10),maxX:parseInt(E[2], 10),maxY:parseInt(E[3], 10)};
            D.width = D.maxX - D.minX;
            D.height = D.maxY - D.minY;
            D.toString = function() {
                return[this.minX,this.minY,this.width,this.height].join(" ")
            };
            return D
        })();
        this.ascent = -parseInt(B.ascent, 10);
        this.descent = -parseInt(B.descent, 10);
        this.height = -this.ascent + this.descent
    }

    function f() {
        var C = {},B = {oblique:"italic",italic:"oblique"};
        this.add = function(D) {
            (C[D.style] || (C[D.style] = {}))[D.weight] = D
        };
        this.get = function(H, I) {
            var G = C[H] || C[B[H]] || C.normal || C.italic || C.oblique;
            if (!G) {
                return null
            }
            I = {normal:400,bold:700}[I] || parseInt(I, 10);
            if (G[I]) {
                return G[I]
            }
            var E = {1:1,99:0}[I % 100],K = [],F,D;
            if (E === undefined) {
                E = I > 400
            }
            if (I == 500) {
                I = 400
            }
            for (var J in G) {
                if (!k(G, J)) {
                    continue
                }
                J = parseInt(J, 10);
                if (!F || J < F) {
                    F = J
                }
                if (!D || J > D) {
                    D = J
                }
                K.push(J)
            }
            if (I < F) {
                I = F
            }
            if (I > D) {
                I = D
            }
            K.sort(function(M, L) {
                return(E ? (M > I && L > I) ? M < L : M > L : (M < I && L < I) ? M > L : M < L) ? -1 : 1
            });
            return G[K[0]]
        }
    }

    function r() {
        function D(F, G) {
            if (F.contains) {
                return F.contains(G)
            }
            return F.compareDocumentPosition(G) & 16
        }

        function B(G) {
            var F = G.relatedTarget;
            if (!F || D(this, F)) {
                return
            }
            C(this)
        }

        function E(F) {
            C(this)
        }

        function C(F) {
            setTimeout(function() {
                m.replace(F, d.get(F).options, true)
            }, 10)
        }

        this.attach = function(F) {
            if (F.onmouseenter === undefined) {
                q(F, "mouseover", B);
                q(F, "mouseout", B)
            } else {
                q(F, "mouseenter", E);
                q(F, "mouseleave", E)
            }
        }
    }

    function u() {
        var C = [],D = {};

        function B(H) {
            var E = [],G;
            for (var F = 0; G = H[F]; ++F) {
                E[F] = C[D[G]]
            }
            return E
        }

        this.add = function(F, E) {
            D[F] = C.push(E) - 1
        };
        this.repeat = function() {
            var E = arguments.length ? B(arguments) : C,F;
            for (var G = 0; F = E[G++];) {
                m.replace(F[0], F[1], true)
            }
        }
    }

    function A() {
        var D = {},B = 0;

        function C(E) {
            return E.cufid || (E.cufid = ++B)
        }

        this.get = function(E) {
            var F = C(E);
            return D[F] || (D[F] = {})
        }
    }

    function a(B) {
        var D = {},C = {};
        this.extend = function(E) {
            for (var F in E) {
                if (k(E, F)) {
                    D[F] = E[F]
                }
            }
            return this
        };
        this.get = function(E) {
            return D[E] != undefined ? D[E] : B[E]
        };
        this.getSize = function(F, E) {
            return C[F] || (C[F] = new n.Size(this.get(F), E))
        };
        this.isUsable = function() {
            return !!B
        }
    }

    function q(C, B, D) {
        if (C.addEventListener) {
            C.addEventListener(B, D, false)
        } else {
            if (C.attachEvent) {
                C.attachEvent("on" + B, function() {
                    return D.call(C, window.event)
                })
            }
        }
    }

    function v(C, B) {
        var D = d.get(C);
        if (D.options) {
            return C
        }
        if (B.hover && B.hoverables[C.nodeName.toLowerCase()]) {
            b.attach(C)
        }
        D.options = B;
        return C
    }

    function j(B) {
        var C = {};
        return function(D) {
            if (!k(C, D)) {
                C[D] = B.apply(null, arguments)
            }
            return C[D]
        }
    }

    function c(F, E) {
        var B = n.quotedList(E.get("fontFamily").toLowerCase()),D;
        for (var C = 0; D = B[C]; ++C) {
            if (i[D]) {
                return i[D].get(E.get("fontStyle"), E.get("fontWeight"))
            }
        }
        return null
    }

    function g(B) {
        return document.getElementsByTagName(B)
    }

    function k(C, B) {
        return C.hasOwnProperty(B)
    }

    function h() {
        var B = {},D,F;
        for (var E = 0,C = arguments.length; D = arguments[E],E < C; ++E) {
            for (F in D) {
                if (k(D, F)) {
                    B[F] = D[F]
                }
            }
        }
        return B
    }

    function o(E, M, C, N, F, D) {
        var K = document.createDocumentFragment(),H;
        if (M === "") {
            return K
        }
        var L = N.separate;
        var I = M.split(p[L]),B = (L == "words");
        if (B && t) {
            if (/^\s/.test(M)) {
                I.unshift("")
            }
            if (/\s$/.test(M)) {
                I.push("")
            }
        }
        for (var J = 0,G = I.length; J < G; ++J) {
            H = z[N.engine](E, B ? n.textAlign(I[J], C, J, G) : I[J], C, N, F, D, J < G - 1);
            if (H) {
                K.appendChild(H)
            }
        }
        return K
    }

    function l(C, J) {
        var B = n.getStyle(v(C, J)).extend(J);
        var D = c(C, B),E,H,G,F,I;
        for (E = C.firstChild; E; E = G) {
            H = E.nodeType;
            G = E.nextSibling;
            if (H == 3) {
                if (F) {
                    F.appendData(E.data);
                    C.removeChild(E)
                } else {
                    F = E
                }
                if (G) {
                    continue
                }
            }
            if (F) {
                C.replaceChild(o(D, n.whiteSpace(F.data, B, F), B, J, E, C), F);
                F = null
            }
            if (H == 1 && E.firstChild) {
                if (n.hasClass(E, "cufon")) {
                    z[J.engine](D, null, B, J, E, C)
                } else {
                    arguments.callee(E, J)
                }
            }
        }
    }

    var t = " ".split(/\s+/).length == 0;
    var d = new A();
    var b = new r();
    var y = new u();
    var e = false;
    var z = {},i = {},w = {enableTextDecoration:false,engine:null,forceHitArea:false,hover:false,hoverables:{a:true},printable:true,selector:(window.Sizzle || (window.jQuery && function(B) {
        return jQuery(B)
    }) || (window.dojo && dojo.query) || (window.Ext && Ext.query) || (window.$$ && function(B) {
        return $$(B)
    }) || (window.$ && function(B) {
        return $(B)
    }) || (document.querySelectorAll && function(B) {
        return document.querySelectorAll(B)
    }) || g),separate:"words",textShadow:"none"};
    var p = {words:/[^\S\u00a0]+/,characters:"",none:/^/};
    m.now = function() {
        x.ready();
        return m
    };
    m.refresh = function() {
        y.repeat.apply(y, arguments);
        return m
    };
    m.registerEngine = function(C, B) {
        if (!B) {
            return m
        }
        z[C] = B;
        return m.set("engine", C)
    };
    m.registerFont = function(D) {
        var B = new s(D),C = B.family;
        if (!i[C]) {
            i[C] = new f()
        }
        i[C].add(B);
        return m.set("fontFamily", '"' + C + '"')
    };
    m.replace = function(D, C, B) {
        C = h(w, C);
        if (!C.engine) {
            return m
        }
        if (!e) {
            n.addClass(x.root(), "cufon-active cufon-loading");
            n.ready(function() {
                n.addClass(n.removeClass(x.root(), "cufon-loading"), "cufon-ready")
            });
            e = true
        }
        if (C.hover) {
            C.forceHitArea = true
        }
        if (typeof C.textShadow == "string") {
            C.textShadow = n.textShadow(C.textShadow)
        }
        if (typeof C.color == "string" && /^-/.test(C.color)) {
            C.textGradient = n.gradient(C.color)
        }
        if (!B) {
            y.add(D, arguments)
        }
        if (D.nodeType || typeof D == "string") {
            D = [D]
        }
        n.ready(function() {
            for (var F = 0,E = D.length; F < E; ++F) {
                var G = D[F];
                if (typeof G == "string") {
                    m.replace(C.selector(G), C, true)
                } else {
                    l(G, C)
                }
            }
        });
        return m
    };
    m.set = function(B, C) {
        w[B] = C;
        return m
    };
    return m
})();
Cufon.registerEngine("canvas", (function() {
    var b = document.createElement("canvas");
    if (!b || !b.getContext || !b.getContext.apply) {
        return
    }
    b = null;
    var a = Cufon.CSS.supports("display", "inline-block");
    var e = !a && (document.compatMode == "BackCompat" || /frameset|transitional/i.test(document.doctype.publicId));
    var f = document.createElement("style");
    f.type = "text/css";
    f.appendChild(document.createTextNode((".cufon-canvas{text-indent:0;}@media screen,projection{.cufon-canvas{display:inline;display:inline-block;position:relative;vertical-align:middle;" + (e ? "" : "font-size:1px;line-height:1px;") + "}.cufon-canvas .cufon-alt{display:-moz-inline-box;display:inline-block;width:0;height:0;overflow:hidden;text-indent:-10000in;}" + (a ? ".cufon-canvas canvas{position:relative;}" : ".cufon-canvas canvas{position:absolute;}") + "}@media print{.cufon-canvas{padding:0;}.cufon-canvas canvas{display:none;}.cufon-canvas .cufon-alt{display:inline;}}").replace(/;/g, "!important;")));
    document.getElementsByTagName("head")[0].appendChild(f);
    function d(p, h) {
        var n = 0,m = 0;
        var g = [],o = /([mrvxe])([^a-z]*)/g,k;
        generate:for (var j = 0; k = o.exec(p); ++j) {
            var l = k[2].split(",");
            switch (k[1]) {case"v":g[j] = {m:"bezierCurveTo",a:[n + ~~l[0],m + ~~l[1],n + ~~l[2],m + ~~l[3],n += ~~l[4],m += ~~l[5]]};break;case"r":g[j] = {m:"lineTo",a:[n += ~~l[0],m += ~~l[1]]};break;case"m":g[j] = {m:"moveTo",a:[n = ~~l[0],m = ~~l[1]]};break;case"x":g[j] = {m:"closePath"};break;case"e":break generate
            }
            h[g[j].m].apply(h, g[j].a)
        }
        return g
    }

    function c(m, k) {
        for (var j = 0,h = m.length; j < h; ++j) {
            var g = m[j];
            k[g.m].apply(k, g.a)
        }
    }

    return function(ah, H, Z, D, L, ai) {
        var n = (H === null);
        if (n) {
            H = L.alt
        }
        var J = ah.viewBox;
        var p = Z.getSize("fontSize", ah.baseSize);
        var X = Z.get("letterSpacing");
        X = (X == "normal") ? 0 : p.convertFrom(parseInt(X, 10));
        var K = 0,Y = 0,W = 0,F = 0;
        var I = D.textShadow,U = [];
        if (I) {
            for (var ag = I.length; ag--;) {
                var O = I[ag];
                var T = p.convertFrom(parseFloat(O.offX));
                var R = p.convertFrom(parseFloat(O.offY));
                U[ag] = [T,R];
                if (R < K) {
                    K = R
                }
                if (T > Y) {
                    Y = T
                }
                if (R > W) {
                    W = R
                }
                if (T < F) {
                    F = T
                }
            }
        }
        var al = Cufon.CSS.textTransform(H, Z).split(""),B;
        var o = ah.glyphs,E,r,ac;
        var h = 0,v,N = [];
        for (var ag = 0,ae = 0,ab = al.length; ag < ab; ++ag) {
            E = o[B = al[ag]] || ah.missingGlyph;
            if (!E) {
                continue
            }
            if (r) {
                h -= ac = r[B] || 0;
                N[ae - 1] -= ac
            }
            h += v = N[ae++] = ~~(E.w || ah.w) + X;
            r = E.k
        }
        if (v === undefined) {
            return null
        }
        Y += J.width - v;
        F += J.minX;
        var C,q;
        if (n) {
            C = L;
            q = L.firstChild
        } else {
            C = document.createElement("span");
            C.className = "cufon cufon-canvas";
            C.alt = H;
            q = document.createElement("canvas");
            C.appendChild(q);
            if (D.printable) {
                var ad = document.createElement("span");
                ad.className = "cufon-alt";
                ad.appendChild(document.createTextNode(H));
                C.appendChild(ad)
            }
        }
        var am = C.style;
        var Q = q.style;
        var m = p.convert(J.height);
        var ak = Math.ceil(m);
        var V = ak / m;
        var P = V * Cufon.CSS.fontStretch(Z.get("fontStretch"));
        var S = h * P;
        var aa = Math.ceil(p.convert(S + Y - F));
        var t = Math.ceil(p.convert(J.height - K + W));
        q.width = aa;
        q.height = t;
        Q.width = aa + "px";
        Q.height = t + "px";
        K += J.minY;
        Q.top = Math.round(p.convert(K - ah.ascent)) + "px";
        Q.left = Math.round(p.convert(F)) + "px";
        var A = Math.ceil(p.convert(S)) + "px";
        if (a) {
            am.width = A;
            am.height = p.convert(ah.height) + "px"
        } else {
            am.paddingLeft = A;
            am.paddingBottom = (p.convert(ah.height) - 1) + "px"
        }
        var aj = q.getContext("2d"),M = m / J.height;
        aj.scale(M, M * V);
        aj.translate(-F, -K);
        aj.lineWidth = ah.face["underline-thickness"];
        aj.save();
        function s(i, g) {
            aj.strokeStyle = g;
            aj.beginPath();
            aj.moveTo(0, i);
            aj.lineTo(h, i);
            aj.stroke()
        }

        var u = D.enableTextDecoration ? Cufon.CSS.textDecoration(ai, Z) : {};
        if (u.underline) {
            s(-ah.face["underline-position"], u.underline)
        }
        if (u.overline) {
            s(ah.ascent, u.overline)
        }
        function af() {
            aj.scale(P, 1);
            for (var x = 0,k = 0,g = al.length; x < g; ++x) {
                var y = o[al[x]] || ah.missingGlyph;
                if (!y) {
                    continue
                }
                if (y.d) {
                    aj.beginPath();
                    if (y.code) {
                        c(y.code, aj)
                    } else {
                        y.code = d("m" + y.d, aj)
                    }
                    aj.fill()
                }
                aj.translate(N[k++], 0)
            }
            aj.restore()
        }

        if (I) {
            for (var ag = I.length; ag--;) {
                var O = I[ag];
                aj.save();
                aj.fillStyle = O.color;
                aj.translate.apply(aj, U[ag]);
                af()
            }
        }
        var z = D.textGradient;
        if (z) {
            var G = z.stops,w = aj.createLinearGradient(0, J.minY, 0, J.maxY);
            for (var ag = 0,ab = G.length; ag < ab; ++ag) {
                w.addColorStop.apply(w, G[ag])
            }
            aj.fillStyle = w
        } else {
            aj.fillStyle = Z.get("color")
        }
        af();
        if (u["line-through"]) {
            s(-ah.descent, u["line-through"])
        }
        return C
    }
})());
Cufon.registerEngine("vml", (function() {
    var e = document.namespaces;
    if (!e) {
        return
    }
    e.add("cvml", "urn:schemas-microsoft-com:vml");
    e = null;
    var b = document.createElement("cvml:shape");
    b.style.behavior = "url(#default#VML)";
    if (!b.coordsize) {
        return
    }
    b = null;
    var g = (document.documentMode || 0) < 8;
    document.write(('<style type="text/css">.cufon-vml-canvas{text-indent:0;}@media screen{cvml\\:shape,cvml\\:rect,cvml\\:fill,cvml\\:shadow{behavior:url(#default#VML);display:block;antialias:true;position:absolute;}.cufon-vml-canvas{position:absolute;text-align:left;}.cufon-vml{display:inline-block;position:relative;vertical-align:' + (g ? "middle" : "text-bottom") + ";}.cufon-vml .cufon-alt{position:absolute;left:-10000in;font-size:1px;}a .cufon-vml{cursor:pointer}}@media print{.cufon-vml *{display:none;}.cufon-vml .cufon-alt{display:inline;}}</style>").replace(/;/g, "!important;"));
    function c(h, i) {
        return a(h, /(?:em|ex|%)$|^[a-z-]+$/i.test(i) ? "1em" : i)
    }

    function a(k, l) {
        if (/px$/i.test(l)) {
            return parseFloat(l)
        }
        var j = k.style.left,i = k.runtimeStyle.left;
        k.runtimeStyle.left = k.currentStyle.left;
        k.style.left = l.replace("%", "em");
        var h = k.style.pixelLeft;
        k.style.left = j;
        k.runtimeStyle.left = i;
        return h
    }

    var f = {};

    function d(o) {
        var p = o.id;
        if (!f[p]) {
            var m = o.stops,n = document.createElement("cvml:fill"),h = [];
            n.type = "gradient";
            n.angle = 180;
            n.focus = "0";
            n.method = "sigma";
            n.color = m[0][1];
            for (var l = 1,i = m.length - 1; l < i; ++l) {
                h.push(m[l][0] * 100 + "% " + m[l][1])
            }
            n.colors = h.join(",");
            n.color2 = m[i][1];
            f[p] = n
        }
        return f[p]
    }

    return function(aj, K, ad, G, O, ak, ab) {
        var o = (K === null);
        if (o) {
            K = O.alt
        }
        var M = aj.viewBox;
        var q = ad.computedFontSize || (ad.computedFontSize = new Cufon.CSS.Size(c(ak, ad.get("fontSize")) + "px", aj.baseSize));
        var aa = ad.computedLSpacing;
        if (aa == undefined) {
            aa = ad.get("letterSpacing");
            ad.computedLSpacing = aa = (aa == "normal") ? 0 : ~~q.convertFrom(a(ak, aa))
        }
        var C,r;
        if (o) {
            C = O;
            r = O.firstChild
        } else {
            C = document.createElement("span");
            C.className = "cufon cufon-vml";
            C.alt = K;
            r = document.createElement("span");
            r.className = "cufon-vml-canvas";
            C.appendChild(r);
            if (G.printable) {
                var ag = document.createElement("span");
                ag.className = "cufon-alt";
                ag.appendChild(document.createTextNode(K));
                C.appendChild(ag)
            }
            if (!ab) {
                C.appendChild(document.createElement("cvml:shape"))
            }
        }
        var ap = C.style;
        var V = r.style;
        var m = q.convert(M.height),am = Math.ceil(m);
        var Z = am / m;
        var T = Z * Cufon.CSS.fontStretch(ad.get("fontStretch"));
        var Y = M.minX,X = M.minY;
        V.height = am;
        V.top = Math.round(q.convert(X - aj.ascent));
        V.left = Math.round(q.convert(Y));
        ap.height = q.convert(aj.height) + "px";
        var v = G.enableTextDecoration ? Cufon.CSS.textDecoration(ak, ad) : {};
        var J = ad.get("color");
        var ao = Cufon.CSS.textTransform(K, ad).split(""),B;
        var p = aj.glyphs,H,s,af;
        var h = 0,P = [],W = 0,x;
        var z,L = G.textShadow;
        for (var ai = 0,ah = 0,ae = ao.length; ai < ae; ++ai) {
            H = p[B = ao[ai]] || aj.missingGlyph;
            if (!H) {
                continue
            }
            if (s) {
                h -= af = s[B] || 0;
                P[ah - 1] -= af
            }
            h += x = P[ah++] = ~~(H.w || aj.w) + aa;
            s = H.k
        }
        if (x === undefined) {
            return null
        }
        var A = -Y + h + (M.width - x);
        var an = q.convert(A * T),ac = Math.round(an);
        var S = A + "," + M.height,n;
        var N = "r" + S + "ns";
        var y = G.textGradient && d(G.textGradient);
        for (ai = 0,ah = 0; ai < ae; ++ai) {
            H = p[ao[ai]] || aj.missingGlyph;
            if (!H) {
                continue
            }
            if (o) {
                z = r.childNodes[ah];
                while (z.firstChild) {
                    z.removeChild(z.firstChild)
                }
            } else {
                z = document.createElement("cvml:shape");
                r.appendChild(z)
            }
            z.stroked = "f";
            z.coordsize = S;
            z.coordorigin = n = (Y - W) + "," + X;
            z.path = (H.d ? "m" + H.d + "xe" : "") + "m" + n + N;
            z.fillcolor = J;
            if (y) {
                z.appendChild(y.cloneNode(false))
            }
            var al = z.style;
            al.width = ac;
            al.height = am;
            if (L) {
                var u = L[0],t = L[1];
                var F = Cufon.CSS.color(u.color),D;
                var R = document.createElement("cvml:shadow");
                R.on = "t";
                R.color = F.color;
                R.offset = u.offX + "," + u.offY;
                if (t) {
                    D = Cufon.CSS.color(t.color);
                    R.type = "double";
                    R.color2 = D.color;
                    R.offset2 = t.offX + "," + t.offY
                }
                R.opacity = F.opacity || (D && D.opacity) || 1;
                z.appendChild(R)
            }
            W += P[ah++]
        }
        var Q = z.nextSibling,w,E;
        if (G.forceHitArea) {
            if (!Q) {
                Q = document.createElement("cvml:rect");
                Q.stroked = "f";
                Q.className = "cufon-vml-cover";
                w = document.createElement("cvml:fill");
                w.opacity = 0;
                Q.appendChild(w);
                r.appendChild(Q)
            }
            E = Q.style;
            E.width = ac;
            E.height = am
        } else {
            if (Q) {
                r.removeChild(Q)
            }
        }
        ap.width = Math.max(Math.ceil(q.convert(h * T)), 0);
        if (g) {
            var U = ad.computedYAdjust;
            if (U === undefined) {
                var I = ad.get("lineHeight");
                if (I == "normal") {
                    I = "1em"
                } else {
                    if (!isNaN(I)) {
                        I += "em"
                    }
                }
                ad.computedYAdjust = U = 0.5 * (a(ak, I) - parseFloat(ap.height))
            }
            if (U) {
                ap.marginTop = Math.ceil(U) + "px";
                ap.marginBottom = U + "px"
            }
        }
        return C
    }
})());

Cufon.registerFont({"w":191,"face":{"font-family":"vag","font-weight":400,"font-stretch":"normal","units-per-em":"360","panose-1":"2 15 8 2 2 2 6 2 3 -49","ascent":"283","descent":"-77","x-height":"4","bbox":"-13 -330 313 76.9494","underline-thickness":"40.957","underline-position":"-17.0508","unicode-range":"U+0020-U+00FF"},"glyphs":{" ":{"w":90},"!":{"d":"46,-246v47,5,20,91,26,139v3,24,-7,33,-26,36v-47,-5,-20,-92,-26,-140v-3,-24,8,-32,26,-35xm17,-24v0,-15,15,-29,30,-29v14,-1,29,14,29,29v0,16,-14,30,-30,30v-16,0,-29,-13,-29,-30","w":92},"\"":{"d":"44,-153v-25,1,-22,-32,-22,-59v0,-20,6,-29,22,-30v27,-2,24,31,23,59v1,19,-7,29,-23,30xm114,-153v-25,0,-24,-32,-23,-59v-6,-36,43,-39,45,-8v2,26,7,68,-22,67","w":158},"#":{"d":"86,-194v4,-15,23,-13,24,0v-1,11,-9,21,-12,31r41,0v7,-14,9,-39,25,-42v21,4,5,29,0,42v14,0,33,-3,33,12v0,17,-27,9,-43,11r-16,40v15,0,34,-3,34,12v0,17,-27,9,-43,11v-8,14,-9,39,-25,43v-24,-2,-4,-30,0,-43r-40,0v-8,14,-10,40,-26,43v-22,-3,-4,-31,0,-43v-14,0,-35,3,-34,-11v0,-17,27,-11,44,-12r16,-40v-14,-1,-34,3,-34,-11v0,-17,27,-11,43,-12xm89,-140r-16,40r40,0r16,-40r-40,0","w":201},"$":{"d":"99,-284v18,0,18,20,17,40v24,4,51,12,51,34v0,56,-86,-11,-95,37v2,12,7,15,22,18v52,14,88,28,88,79v0,42,-28,71,-66,77v0,21,3,42,-17,42v-19,0,-19,-20,-18,-40v-29,-1,-68,-14,-67,-39v5,-62,104,24,111,-37v3,-30,-62,-28,-78,-41v-57,-27,-30,-126,34,-129v-1,-21,-1,-41,18,-41","w":196},"%":{"d":"6,-169v0,-42,16,-77,55,-77v74,0,76,157,0,157v-37,0,-55,-35,-55,-80xm62,-213v-14,0,-21,15,-21,45v0,30,7,45,20,45v14,0,21,-15,21,-45v0,-30,-7,-45,-20,-45xm227,2v-73,-1,-77,-156,0,-157v74,0,76,155,0,157xm227,-122v-14,0,-20,15,-20,45v0,30,7,45,20,45v14,0,20,-15,20,-45v0,-30,-7,-45,-20,-45xm119,-9v-7,20,-34,20,-35,-1v25,-76,58,-146,86,-220v2,-21,35,-20,35,0v-24,77,-61,146,-86,221","w":288},"&":{"d":"181,-190v-1,27,-24,48,-46,59r34,37v11,-10,19,-28,37,-29v20,-1,31,24,17,39r-21,24v9,10,29,26,29,39v-2,25,-34,35,-50,12r-16,-17v-45,50,-161,40,-159,-41v1,-36,23,-58,50,-76v-45,-42,-10,-103,54,-103v38,0,71,20,71,56xm131,-185v2,-26,-41,-23,-41,-1v1,10,12,19,17,26v12,-6,23,-13,24,-25xm59,-73v0,39,53,35,74,13r-48,-51v-14,11,-26,17,-26,38","w":240},"'":{"d":"44,-153v-25,1,-22,-32,-22,-59v0,-20,6,-29,22,-30v27,-2,24,31,23,59v1,19,-7,29,-23,30","w":88},"(":{"d":"89,37v1,16,-27,28,-37,14v-44,-59,-44,-232,0,-294v11,-15,38,-3,37,14v-30,82,-32,184,0,266","w":103},")":{"d":"14,-229v-1,-16,27,-30,38,-14v42,60,44,232,0,294v-11,15,-39,2,-38,-14v31,-80,31,-188,0,-266","w":103},"*":{"d":"69,-246v21,0,18,19,16,38v9,-17,40,-23,41,5v0,16,-17,16,-27,21v11,5,29,7,28,21v0,26,-32,22,-42,5v3,18,4,39,-16,39v-18,0,-19,-22,-15,-39v-9,16,-41,22,-42,-5v-1,-14,18,-16,28,-21v-10,-5,-27,-5,-27,-21v0,-26,32,-24,41,-5v-2,-17,-5,-38,15,-38","w":139},"+":{"d":"96,-35v-27,0,-14,-44,-17,-70v-25,-3,-67,10,-67,-16v-1,-27,42,-14,67,-17v2,-26,-9,-70,17,-70v26,0,15,44,17,70v25,3,67,-10,67,17v0,26,-42,13,-67,16v-3,26,10,70,-17,70"},",":{"d":"52,40v-11,23,-48,13,-47,-12v6,-28,24,-46,35,-69v11,-23,47,-10,47,13v-8,26,-24,45,-35,68","w":96,"k":{"1":9}},"-":{"d":"30,-77v-36,6,-39,-45,-8,-45v30,0,67,-7,67,23v0,25,-31,23,-59,22","w":88,"k":{"\u00c1":-5,"\u00c5":-5,"\u00c4":-5,"Y":16,"W":-4,"V":5,"T":12,"A":-5}},".":{"d":"19,-24v0,-16,14,-29,30,-29v14,-1,29,14,29,29v0,16,-14,30,-30,30v-16,0,-29,-13,-29,-30","w":95,"k":{"1":14}},"\/":{"d":"118,-227v4,-20,34,-23,36,-1r-107,263v-5,12,-7,16,-19,17v-14,0,-20,-14,-13,-30","w":161},"0":{"d":"17,-122v0,-67,25,-124,88,-124v60,0,89,59,89,126v0,67,-28,126,-89,126v-63,0,-88,-55,-88,-128xm106,-48v35,-6,36,-74,27,-111v-6,-22,-15,-33,-27,-33v-47,0,-45,139,0,144","w":211,"k":{"7":15,"4":7,"1":11}},"1":{"d":"71,4v-18,0,-27,-15,-27,-37r0,-158v-44,12,-61,-49,-20,-49v37,0,74,-8,74,35r0,172v1,24,-7,37,-27,37","w":127,"k":{"9":9,"8":6,"7":11,"6":10,"5":11,"4":11,"3":11,"2":8,"1":8,"0":8,".":6,",":8}},"2":{"d":"172,-173v-1,55,-46,86,-80,124v35,2,84,-9,85,25v-1,16,-13,24,-33,24r-103,0v-19,1,-30,-8,-31,-23v11,-45,98,-94,105,-149v2,-13,-10,-24,-23,-24v-33,0,-20,55,-53,55v-14,0,-25,-12,-25,-27v3,-44,33,-78,81,-78v41,-1,78,33,77,73","w":187,"k":{"7":8,"4":14,"1":5}},"3":{"d":"99,-246v64,-5,99,83,45,113v23,13,40,32,40,61v1,45,-39,79,-85,78v-44,-1,-80,-26,-85,-66v-2,-13,12,-26,26,-25v27,0,25,40,57,40v17,0,30,-13,30,-31v0,-39,-58,-15,-58,-51v0,-31,50,-19,50,-48v0,-11,-9,-21,-22,-20v-21,-4,-31,29,-52,29v-12,0,-24,-11,-24,-23v3,-35,41,-54,78,-57","w":199,"k":{"7":13,"4":4,"1":11}},"4":{"d":"129,4v-24,0,-27,-27,-25,-56v-39,-4,-121,12,-96,-34r71,-131v15,-42,76,-31,76,14r0,103v19,-2,31,8,31,24v0,14,-13,26,-31,24v1,30,0,56,-26,56xm104,-100r0,-75r-40,75r40,0","k":{"7":14,"1":12}},"5":{"d":"177,-216v0,35,-54,23,-89,25r-3,30v55,-14,95,22,95,74v0,52,-37,93,-88,93v-32,0,-77,-17,-80,-47v-1,-15,11,-27,25,-27v16,0,31,20,54,20v19,0,32,-18,32,-38v1,-25,-18,-40,-44,-32v-11,11,-57,16,-48,-19v9,-36,-6,-98,35,-103v40,5,111,-16,111,24","k":{"7":4,"4":3,"1":2}},"6":{"d":"104,-241v22,-18,54,12,34,37r-43,52v50,-15,92,27,91,73v-1,51,-36,84,-88,85v-78,2,-108,-83,-69,-150v12,-21,46,-73,75,-97xm129,-79v0,-17,-15,-31,-31,-31v-17,-1,-30,15,-30,31v0,17,13,31,30,31v16,0,31,-14,31,-31","k":{"7":16,"1":12}},"7":{"d":"86,-18v-7,33,-54,27,-55,-3v18,-64,51,-112,74,-170v-37,-4,-100,14,-100,-25v0,-16,13,-26,32,-24v50,6,156,-20,128,43","w":177,"k":{":":7,"8":11,"7":1,"6":21,"5":18,"4":23,"3":11,"2":10,"1":-2,".":31,",":33}},"8":{"d":"98,-246v66,-7,105,77,55,114v21,13,34,31,34,60v0,48,-39,74,-89,78v-80,6,-119,-102,-54,-138v-49,-36,-12,-122,54,-114xm123,-175v0,-13,-12,-25,-24,-25v-12,0,-25,12,-25,25v0,13,11,24,24,24v13,0,26,-11,25,-24xm130,-79v0,-16,-14,-32,-31,-32v-18,0,-33,15,-33,32v0,17,15,32,32,32v16,0,32,-15,32,-32","w":196,"k":{"7":10,"4":2,"1":7}},"9":{"d":"90,1v-23,17,-56,-13,-34,-37v11,-12,28,-30,43,-52v-50,15,-91,-27,-90,-73v1,-50,35,-84,87,-85v78,-2,108,83,69,150v-12,20,-47,74,-75,97xm127,-161v1,-17,-15,-31,-31,-31v-16,0,-31,14,-31,31v0,16,14,31,31,31v17,0,31,-15,31,-31","k":{"7":6,"4":13,"1":4}},":":{"d":"19,-128v0,-16,13,-29,30,-29v14,0,29,14,29,29v1,16,-14,30,-30,30v-16,1,-29,-14,-29,-30xm19,-24v0,-16,14,-29,30,-29v14,-1,29,14,29,29v0,16,-14,30,-30,30v-16,0,-29,-13,-29,-30","w":95},";":{"d":"27,-128v0,-15,13,-29,30,-29v14,0,29,14,29,29v0,16,-14,30,-30,30v-16,1,-29,-14,-29,-30xm52,40v-11,23,-48,13,-47,-12v6,-28,24,-46,35,-69v11,-23,47,-10,47,13v-8,26,-24,45,-35,68","w":96},"<":{"d":"168,-221r0,45r-108,54r108,53r0,45r-156,-79r0,-39","w":180},"=":{"d":"180,-152v0,13,-9,17,-24,16r-122,0v-14,1,-22,-4,-22,-16v0,-12,7,-17,22,-17r124,0v14,-1,22,5,22,17xm180,-92v0,13,-9,17,-24,16r-122,0v-14,1,-22,-4,-22,-16v0,-12,7,-17,22,-17r124,0v14,-1,22,5,22,17"},">":{"d":"12,-24r0,-45r108,-53r-108,-54r0,-45r156,80r0,38","w":180},"?":{"d":"52,-24v0,-15,15,-29,30,-29v14,-1,29,14,29,29v0,16,-14,30,-30,30v-16,0,-29,-13,-29,-30xm168,-170v1,39,-31,61,-60,73v1,19,-8,30,-26,31v-25,1,-27,-24,-27,-52v0,-34,58,-18,53,-51v1,-14,-12,-22,-26,-23v-22,-2,-29,32,-51,32v-13,0,-26,-12,-25,-26v0,-34,42,-62,78,-60v47,3,82,27,84,76","w":173},"@":{"d":"184,-52v-15,-1,-23,-3,-26,-16v-28,36,-92,6,-86,-42v-5,-53,61,-105,99,-64v7,-19,39,-19,37,5r-10,84v0,3,2,4,5,4v20,-3,30,-36,30,-58v0,-47,-37,-78,-85,-78v-55,0,-99,47,-98,100v2,59,41,98,105,94v26,6,62,-27,75,2v-6,25,-46,26,-79,27v-82,1,-132,-48,-132,-124v0,-73,51,-127,128,-127v64,0,113,40,114,106v0,48,-28,88,-77,87xm163,-127v0,-14,-9,-27,-22,-27v-19,-1,-31,19,-31,39v0,16,8,27,23,27v17,0,30,-18,30,-39","w":280},"A":{"d":"213,-41v18,31,-19,58,-42,37v-8,-7,-12,-29,-16,-42r-92,0v-7,21,-9,50,-34,50v-23,0,-32,-21,-23,-45r63,-173v10,-42,66,-40,81,0xm139,-95r-29,-91r-29,91r58,0","w":218,"k":{"\u00d9":7,"\u00db":7,"\u00da":7,"\u00ab":11,"\u00e7":3,"\u00dc":7,"\u00d6":8,"\u00c7":8,"y":9,"w":7,"v":9,"u":4,"t":6,"q":3,"o":3,"g":3,"e":3,"d":3,"c":3,"a":3,"Y":23,"W":10,"V":17,"U":7,"T":22,"Q":8,"O":8,"G":8,"C":8,".":-5,"-":-5,",":-3}},"B":{"d":"105,-240v68,-7,94,81,42,107v29,9,49,28,49,61v0,40,-32,74,-73,72v-47,-3,-106,17,-106,-40r1,-176v3,-32,51,-20,87,-24xm72,-48v30,0,67,6,67,-25v0,-32,-36,-27,-67,-27r0,52xm123,-172v-1,-21,-27,-21,-51,-20r0,43v25,1,52,2,51,-23","w":204,"k":{"\u00d2":3,"\u00d4":3,"\u00d3":3,"\u00c1":4,"\u00c2":4,"\u00c3":4,"\u00d8":2,"\u00c6":8,"\u00d6":3,"\u00c5":4,"\u00c4":4,"Y":15,"W":5,"V":13,"O":3,"A":4}},"C":{"d":"6,-121v1,-74,44,-123,119,-125v32,-1,73,12,72,39v-3,39,-46,13,-72,13v-41,0,-60,32,-60,74v0,44,21,72,61,74v22,1,26,-11,50,-13v13,-1,23,13,23,25v-2,29,-41,40,-73,40v-73,1,-122,-55,-120,-127","w":205,"k":{"\u00d3":7,"\u00c1":-1,"\u00c6":2,"\u00d6":7,"\u00c5":-1,"\u00c4":-1,"O":7,"K":2,"H":2,"A":-1}},"D":{"d":"110,0v-44,-1,-93,12,-93,-41r1,-175v3,-31,48,-23,84,-24v77,-1,121,46,121,121v0,71,-40,121,-113,119xm165,-120v0,-53,-34,-77,-93,-72r0,144v60,7,93,-18,93,-72","w":229,"k":{"\u00c1":8,"\u00c2":8,"\u00c3":8,"\u00c0":8,"\u00c5":8,"\u00c4":8,"Y":14,"X":11,"W":3,"V":10,"T":11,"J":5,"A":8}},"E":{"d":"156,-215v1,34,-50,22,-84,24r0,46v33,2,79,-10,79,25v0,33,-46,22,-79,24r0,47v34,2,85,-11,84,24v0,39,-61,22,-99,25v-30,2,-40,-10,-40,-40r1,-176v5,-37,66,-21,106,-24v22,-1,32,7,32,25","w":165},"F":{"d":"157,-215v0,34,-50,22,-85,24r0,48v33,1,76,-9,76,25v0,32,-44,23,-76,24v-3,39,12,98,-28,98v-17,0,-27,-15,-27,-37r0,-183v6,-36,66,-21,107,-24v22,-1,32,7,33,25","w":164,"k":{"\u00c1":17,"\u00c2":17,"\u00c3":17,"\u00c0":17,"\u00f8":10,"\u00e6":6,"\u00f6":6,"\u00f3":6,"\u00e9":6,"\u00e5":6,"\u00e4":6,"\u00e1":6,"\u00d6":5,"\u00c5":17,"\u00c4":17,"u":10,"r":10,"o":6,"j":7,"i":7,"e":6,"a":6,"O":5,"J":22,"A":17,".":28,"-":-3,",":29}},"G":{"d":"65,-120v0,77,103,111,114,27v-30,1,-60,3,-60,-24v0,-35,51,-24,87,-25v23,-1,28,13,29,35v1,62,-46,113,-110,113v-70,0,-119,-54,-119,-125v0,-72,52,-127,123,-127v36,0,88,18,90,50v1,12,-12,25,-24,24v-22,-1,-38,-26,-68,-25v-39,0,-62,35,-62,77","w":241,"k":{"\u00c1":8,"\u00c2":8,"\u00c3":8,"\u00c0":8,"\u00c6":12,"\u00c5":8,"\u00c4":8,"Y":10,"W":3,"V":8,"T":7,"A":8}},"H":{"d":"229,-33v7,44,-55,48,-55,9r0,-74r-102,0v-3,40,13,102,-28,102v-17,0,-27,-15,-27,-37r0,-174v-1,-25,7,-36,27,-37v39,-2,26,57,28,96r102,0v3,-38,-12,-96,27,-96v19,0,28,15,28,37r0,174","w":245},"I":{"d":"72,-33v7,44,-55,48,-55,9r0,-183v-1,-25,7,-37,27,-37v19,0,28,15,28,37r0,174","w":88},"J":{"d":"74,-207v-7,-44,55,-48,55,-9v0,91,29,222,-70,222v-29,0,-63,-13,-64,-38v0,-14,12,-25,26,-26v21,6,53,29,53,-18r0,-131","w":145,"k":{"\u00c6":10,"\u00c5":6,"\u00c4":6,"A":6}},"K":{"d":"197,-51v23,14,20,55,-10,55v-14,0,-20,-8,-30,-18r-85,-94v-4,42,16,112,-28,112v-17,0,-27,-15,-27,-37r0,-174v-1,-25,7,-36,27,-37v40,-2,25,59,28,99r82,-91v17,-17,45,-5,44,19v-1,13,-7,19,-16,29r-58,59","w":216,"k":{"\u00d3":10,"\u00e6":7,"\u00fc":8,"\u00f6":7,"\u00f3":7,"\u00e5":7,"\u00e4":7,"\u00d6":10,"y":16,"u":8,"o":7,"e":7,"a":7,"T":3,"S":1,"O":10,"G":10,"C":10,"-":10}},"L":{"d":"17,-207v-7,-44,54,-48,55,-9r0,167v34,2,85,-11,84,24v0,38,-59,22,-97,25v-33,2,-41,-10,-42,-42r0,-165","w":149,"k":{"\u00d2":7,"\u00d4":7,"\u00d3":7,"\u00c1":-9,"\u00d5":7,"\u00c6":-5,"\u00fc":2,"\u00dc":6,"\u00d6":7,"\u00c7":7,"\u00c5":-9,"\u00c4":-9,"y":16,"u":2,"Y":28,"W":13,"V":25,"U":6,"T":21,"S":-4,"O":7,"G":7,"C":7,"A":-9,"-":5}},"M":{"d":"287,-38v11,35,-28,55,-48,31v-14,-37,-17,-92,-26,-135v-16,45,-26,96,-45,138v-19,16,-45,3,-52,-18r-38,-120v-9,44,-11,97,-25,135v-17,25,-61,2,-47,-31r28,-174v1,-38,61,-42,72,-8r40,123r37,-118v5,-36,66,-38,73,0","w":293},"N":{"d":"228,-28v2,38,-42,41,-55,12r-101,-129r0,112v7,44,-55,48,-55,9r0,-191v-4,-28,33,-37,50,-16r106,133r0,-109v-7,-44,54,-48,55,-9r0,188","w":245,"k":{"\u00d3":-1,"\u00c1":3,"\u00f8":1,"\u00e6":-1,"\u00c6":7,"\u00fc":-1,"\u00f6":-1,"\u00f3":-1,"\u00e9":-2,"\u00e5":-1,"\u00e4":-1,"\u00e1":-1,"\u00d6":-1,"\u00c7":-1,"\u00c5":3,"\u00c4":3,"u":-1,"o":-1,"e":-2,"a":-1,"O":-1,"G":-1,"C":-1,"A":3,",":2}},"O":{"d":"6,-122v1,-74,45,-124,119,-124v71,0,118,49,118,126v0,71,-47,126,-118,126v-71,0,-120,-54,-119,-128xm184,-120v0,-44,-19,-77,-59,-77v-38,0,-60,33,-60,74v0,45,18,80,60,80v40,0,59,-35,59,-77","w":249,"k":{"\u00c1":8,"\u00c6":14,"\u00c5":8,"\u00c4":8,"Y":13,"X":9,"W":3,"V":9,"T":10,"A":8}},"P":{"d":"194,-159v2,63,-49,89,-121,80v-1,36,8,83,-27,83v-17,0,-28,-15,-28,-37r1,-183v3,-33,52,-23,89,-24v55,-1,85,30,86,81xm138,-159v1,-31,-31,-36,-65,-33r0,65v34,3,64,-2,65,-32","w":198,"k":{"\u00c1":16,"\u00f8":9,"\u00e6":4,"\u00c6":23,"\u00f6":4,"\u00f3":4,"\u00e9":4,"\u00e5":4,"\u00e4":4,"\u00e1":4,"\u00c5":16,"\u00c4":16,"o":4,"e":4,"a":4,"J":23,"A":16,".":30,"-":-5,",":31}},"Q":{"d":"236,-30v24,12,18,51,-10,50v-13,0,-30,-20,-41,-28v-87,42,-179,-16,-179,-113v0,-70,49,-125,120,-125v101,0,149,125,96,204xm65,-121v0,49,29,89,78,75v-22,-9,-22,-49,7,-51v9,0,20,11,28,16v19,-50,0,-117,-53,-116v-40,1,-60,34,-60,76","w":262},"R":{"d":"180,-48v24,19,15,52,-14,52v-11,0,-19,-8,-27,-17r-67,-85v-3,40,13,102,-28,102v-17,0,-27,-15,-27,-37r0,-183v4,-32,52,-23,89,-24v47,0,85,29,84,74v0,36,-22,62,-56,66xm136,-163v1,-29,-32,-31,-64,-29r0,56v31,1,64,2,64,-27","w":204,"k":{"\u00d3":5,"\u00e6":5,"\u00fc":4,"\u00fa":4,"\u00f6":5,"\u00f3":5,"\u00e9":5,"\u00e5":5,"\u00e4":5,"\u00e1":5,"\u00dc":3,"\u00d6":5,"\u00c7":4,"y":3,"u":4,"o":5,"e":5,"a":5,"Y":10,"W":4,"V":8,"U":3,"T":7,"O":5,"G":5,"C":4,"-":1}},"S":{"d":"11,-170v0,-48,38,-75,89,-76v28,0,66,9,66,35v0,56,-84,-12,-96,36v9,33,76,26,91,49v51,47,6,140,-70,132v-34,-3,-81,-10,-81,-41v0,-64,107,29,114,-36v4,-31,-60,-29,-83,-44v-19,-13,-30,-30,-30,-55","w":192,"k":{"\u00c1":4,"\u00c6":8,"\u00c5":4,"\u00c4":4,"t":8,"Y":10,"W":6,"V":9,"T":7,"A":4}},"T":{"d":"175,-215v0,25,-30,26,-60,24r0,158v1,24,-7,37,-27,37v-17,0,-28,-15,-28,-37r0,-158v-29,0,-61,4,-60,-24v0,-17,12,-25,33,-25r109,0v22,-1,33,8,33,25","w":174,"k":{"\u00d2":10,"\u00d4":10,"\u00d3":10,"\u00c1":20,"\u00c2":20,"\u00d5":10,"\u00c3":20,"\u00c0":20,"\u00ab":28,"\u00f8":23,"\u00e6":21,"\u00d8":10,"\u00c6":27,"\u00d6":10,"\u00c5":20,"\u00c4":20,"y":24,"w":22,"v":25,"u":21,"s":22,"r":19,"o":21,"j":3,"i":3,"g":21,"e":21,"c":21,"a":21,"Y":-3,"W":-5,"V":-4,"S":4,"O":10,"J":21,"G":11,"C":10,"A":20,";":11,":":6,".":21,"-":10,",":22}},"U":{"d":"168,-207v-7,-44,54,-48,55,-9r0,111v3,76,-40,111,-105,111v-59,0,-104,-37,-104,-97r0,-116v-7,-44,51,-48,55,-9v6,64,-25,170,50,170v69,0,45,-94,49,-161","w":237,"k":{"\u00c1":7,"\u00c2":7,"\u00c3":7,"\u00c6":13,"\u00c5":7,"\u00c4":7,"r":-1,"p":-1,"n":-1,"m":-1,"A":7,".":7,",":9}},"V":{"d":"9,-197v-19,-29,15,-60,40,-40v24,41,38,99,58,145v20,-47,33,-104,59,-145v23,-20,53,6,40,40r-71,179v-6,26,-42,32,-53,4","w":214,"k":{"\u00d2":9,"\u00d4":9,"\u00d3":9,"\u00c1":17,"\u00c2":17,"\u00d5":9,"\u00c3":17,"\u00c0":17,"\u00ab":23,"\u00f8":17,"\u00e6":15,"\u00d8":8,"\u00c6":24,"\u00d6":9,"\u00c5":17,"\u00c4":17,"y":5,"u":12,"r":12,"o":15,"i":4,"g":15,"e":16,"a":15,"T":-4,"S":6,"O":9,"G":11,"C":10,"A":17,";":8,":":3,".":26,"-":5,",":27}},"W":{"d":"263,-236v21,-20,53,-1,45,34r-42,175v-2,25,-36,41,-59,24v-27,-34,-33,-93,-51,-137r-34,111v-5,38,-65,44,-74,8r-47,-197v-2,-22,31,-36,46,-18v20,41,24,101,38,148r41,-131v7,-34,49,-31,59,0r41,131v13,-48,20,-104,37,-148","w":311,"k":{"\u00d2":2,"\u00d4":2,"\u00d3":2,"\u00c1":10,"\u00c2":10,"\u00d5":2,"\u00c3":10,"\u00c0":10,"\u00ab":14,"\u00f8":8,"\u00e6":6,"\u00d8":1,"\u00c6":16,"\u00d6":2,"\u00c5":10,"\u00c4":10,"y":1,"u":6,"r":4,"o":6,"i":3,"g":6,"e":5,"a":6,"T":-5,"S":2,"O":2,"G":3,"C":3,"A":10,";":-3,":":-7,".":12,"-":-4,",":14}},"X":{"d":"144,-224v10,-29,55,-24,56,8v-10,33,-42,60,-59,87v22,35,58,65,72,106v-1,30,-44,35,-55,8r-49,-67r-57,79v-30,21,-58,-13,-34,-45r60,-81v-18,-28,-49,-53,-60,-88v0,-30,43,-36,54,-8r37,50","w":220,"k":{"\u00d6":11,"y":17,"u":10,"o":9,"e":9,"a":9,"Q":11,"O":11,"C":11,"-":8}},"Y":{"d":"145,-225v12,-27,53,-22,56,8v-14,39,-49,70,-71,104v-5,44,17,117,-28,117v-42,0,-23,-73,-27,-117v-22,-34,-55,-64,-69,-103v-2,-24,31,-37,47,-18v17,21,33,46,49,68","w":207,"k":{"\u00d2":13,"\u00d4":13,"\u00d3":13,"\u00c1":24,"\u00c2":24,"\u00d5":13,"\u00c3":24,"\u00c0":24,"\u00ab":33,"\u00f8":26,"\u00e6":24,"\u00d8":14,"\u00c6":31,"\u00d6":13,"\u00c5":24,"\u00c4":24,"v":13,"u":18,"p":17,"o":24,"i":6,"g":24,"e":25,"a":24,"T":-2,"S":8,"O":13,"G":15,"C":14,"A":24,";":16,":":12,".":31,"-":18,",":30}},"Z":{"d":"151,-240v31,-2,41,28,25,49r-105,142v41,6,117,-18,117,24v0,17,-12,25,-33,25r-120,0v-36,2,-45,-35,-22,-54r102,-137v-40,-5,-110,16,-110,-24v0,-16,12,-25,32,-25r114,0","w":187,"k":{"y":7,"v":9}},"[":{"d":"106,-227v-1,16,-16,20,-36,19r0,223v19,-1,36,1,36,19v1,21,-25,19,-48,19v-22,0,-32,-10,-32,-31r0,-238v-3,-30,23,-32,54,-30v15,0,26,4,26,19","w":106},"\\":{"d":"150,22v13,18,-6,37,-23,27v-43,-81,-71,-179,-112,-263v-11,-24,19,-43,28,-21","w":161},"]":{"d":"2,34v0,-16,17,-21,37,-19r0,-223v-40,10,-51,-38,-10,-38v30,0,54,0,54,30r0,238v3,30,-23,31,-54,31v-16,0,-27,-5,-27,-19","w":106},"^":{"d":"50,-121r-48,0r58,-120r60,0r58,120r-48,0r-40,-84","w":180},"_":{"d":"0,17r180,0r0,41r-180,0r0,-41","w":180},"`":{"d":"109,-240v21,6,17,39,-4,36v-24,-3,-40,-16,-61,-23v-20,-6,-17,-38,4,-36v23,2,40,17,61,23","w":180},"a":{"d":"186,-29v3,34,-44,43,-53,11v-45,55,-136,-6,-127,-74v-6,-67,80,-127,128,-73v6,-29,52,-24,52,7r0,129xm132,-92v0,-25,-14,-46,-37,-45v-22,0,-36,21,-36,45v0,25,12,47,36,46v23,0,37,-21,37,-46","w":201,"k":{"y":4,"w":2,"v":4,"j":2}},"b":{"d":"15,-229v-7,-41,53,-46,53,-9r0,67v54,-43,131,13,125,79v8,68,-78,129,-125,75v-9,31,-53,22,-53,-9r0,-203xm140,-91v0,-23,-14,-47,-36,-46v-21,0,-36,21,-36,45v0,26,15,45,37,46v22,1,35,-22,35,-45","w":199,"k":{"y":6,"w":5,"v":6}},"c":{"d":"6,-92v1,-56,36,-94,91,-94v27,0,60,7,60,35v0,35,-36,20,-59,14v-22,0,-39,21,-39,46v0,27,16,45,40,45v22,-5,58,-19,58,15v0,26,-35,35,-63,35v-51,0,-89,-41,-88,-96","w":164,"k":{"k":2,"h":2}},"d":{"d":"6,-92v0,-66,69,-123,125,-77v3,-37,-13,-95,27,-95v17,1,26,14,26,35r0,201v5,33,-47,41,-52,10v-45,56,-126,-6,-126,-74xm131,-94v0,-23,-13,-46,-35,-46v-22,0,-37,22,-37,46v0,25,15,46,37,46v22,0,35,-23,35,-46","w":199},"e":{"d":"97,-186v50,0,87,37,87,91v0,14,-8,21,-23,21r-98,0v9,37,56,37,85,17v15,-10,33,4,33,19v-2,26,-48,42,-79,42v-53,0,-95,-37,-96,-92v-1,-55,39,-98,91,-98xm132,-110v-2,-32,-39,-43,-59,-22v-4,5,-9,12,-12,22r71,0","w":190,"k":{"y":7,"x":2,"w":4,"v":6,"t":5}},"f":{"d":"128,-158v0,19,-17,27,-41,24r0,101v7,42,-52,46,-53,9v-1,-35,4,-79,-2,-110v-38,6,-43,-48,-8,-48r10,0v-6,-49,15,-78,58,-81v32,-3,42,48,10,48v-18,0,-15,17,-15,33v24,-1,41,3,41,24","w":128,"k":{"\u00f8":10,"\u00e6":5,"\u00f6":5,"\u00f3":5,"\u00e9":5,"\u00e5":5,"\u00e4":5,"\u00e1":5,"t":-6,"s":4,"o":5,"l":2,"j":5,"i":4,"f":-6,"e":5,"a":5}},"g":{"d":"6,-90v-8,-68,78,-129,125,-75v9,-28,51,-25,51,9r0,140v1,57,-36,92,-93,91v-33,-1,-77,-8,-80,-39v12,-61,118,43,122,-56v-42,56,-135,3,-125,-70xm130,-91v0,-24,-12,-46,-36,-46v-23,0,-35,21,-35,46v0,25,13,45,36,45v23,0,35,-22,35,-45","w":197,"k":{"\u00e6":-1,"\u00f6":-1,"\u00f3":-1,"\u00e5":-1,"\u00e4":-1,"r":-1,"l":-1,"a":-1}},"h":{"d":"15,-229v-7,-41,53,-46,53,-9r0,67v48,-32,118,-12,113,52v-4,48,20,143,-44,115v-27,-29,18,-137,-38,-137v-43,0,-29,65,-31,108v5,31,-23,43,-44,29v-7,-6,-9,-18,-9,-29r0,-196","w":196,"k":{"y":6}},"i":{"d":"16,-233v-1,-17,14,-31,31,-31v16,-1,30,15,30,31v1,17,-14,31,-31,31v-16,0,-30,-15,-30,-31xm46,2v-19,1,-26,-14,-26,-35r0,-117v-1,-24,7,-35,26,-35v18,0,26,14,26,35r0,117v1,23,-6,33,-26,35","w":92,"k":{"j":4,"T":3}},"j":{"d":"16,-233v-1,-17,14,-31,31,-31v16,-1,30,15,30,31v1,16,-14,31,-30,31v-16,0,-31,-14,-31,-31xm48,74v-19,1,-26,-14,-26,-35r0,-189v-1,-24,7,-35,26,-35v18,0,26,14,26,35r0,189v1,23,-6,33,-26,35","w":92},"k":{"d":"166,-47v30,25,-11,70,-33,42r-65,-82v-3,36,12,89,-26,89v-20,0,-27,-15,-27,-35r0,-196v-7,-41,53,-46,53,-9r0,115v23,-19,43,-54,73,-63v27,0,34,36,12,50r-33,32","w":182,"k":{"\u00e6":7,"\u00fc":6,"\u00f6":7,"\u00f3":7,"\u00e9":7,"\u00e5":7,"\u00e4":7,"\u00e1":7,"u":6,"s":2,"o":7,"g":7,"e":7,"a":7,"-":6,",":1}},"l":{"d":"15,-229v-7,-41,53,-46,53,-9r0,205v5,31,-23,43,-44,29v-7,-6,-9,-18,-9,-29r0,-196","w":83,"k":{"y":3,"v":3}},"m":{"d":"15,-155v-2,-33,41,-39,52,-13v26,-26,78,-24,98,5v36,-41,125,-23,119,38v-4,45,20,127,-27,127v-43,0,-26,-73,-26,-115v0,-16,-12,-28,-27,-28v-43,0,-24,67,-28,108v7,42,-50,46,-53,9v-3,-43,17,-114,-27,-116v-43,-1,-24,66,-28,107v5,31,-23,43,-44,29v-19,-34,-5,-102,-9,-151","w":299,"k":{"y":6,"w":4,"v":6,"p":-1}},"n":{"d":"15,-154v-3,-33,42,-42,52,-12v36,-40,123,-18,114,47v-6,44,18,121,-27,121v-61,0,11,-143,-56,-143v-43,0,-27,65,-30,108v5,31,-23,43,-44,29v-19,-34,-5,-101,-9,-150","w":196,"k":{"y":6,"w":4,"v":6,"p":-1,"T":21}},"o":{"d":"6,-92v1,-55,36,-94,89,-94v52,0,88,39,88,95v0,54,-34,95,-88,95v-53,0,-89,-39,-89,-96xm131,-91v0,-25,-13,-45,-37,-46v-21,-1,-35,21,-35,45v0,25,14,46,35,46v22,1,37,-22,37,-45","w":189,"k":{"y":7,"x":7,"w":5,"v":7,"t":5,"T":22}},"p":{"d":"15,-154v-4,-33,45,-43,51,-11v46,-52,135,4,126,72v6,67,-69,126,-124,81v2,42,5,108,-44,80v-8,-4,-9,-18,-9,-29r0,-193xm139,-91v0,-23,-15,-46,-37,-46v-23,0,-35,21,-35,45v0,25,12,45,35,46v23,1,37,-22,37,-45","w":197,"k":{"y":5,"t":3}},"q":{"d":"6,-90v0,-68,74,-128,125,-76v8,-28,52,-22,52,8r0,197v7,42,-52,46,-53,9r0,-60v-55,44,-124,-11,-124,-78xm132,-91v0,-25,-13,-45,-37,-46v-22,-1,-36,23,-36,45v0,24,12,47,36,46v24,-1,37,-19,37,-45","w":198,"k":{"c":-1}},"r":{"d":"15,-155v-2,-33,43,-41,53,-11v16,-24,64,-29,64,7v0,36,-64,18,-64,60v0,44,12,123,-44,95v-19,-34,-5,-102,-9,-151","w":131,"k":{"\u00f8":10,"\u00e6":5,"\u00f6":5,"\u00f4":5,"\u00f2":5,"\u00f3":5,"\u00ea":6,"\u00e8":6,"\u00e9":6,"\u00e7":5,"\u00e5":5,"\u00e4":5,"\u00e2":5,"\u00e0":5,"\u00e1":5,"z":-6,"y":-4,"x":2,"w":-4,"v":-3,"u":2,"t":-6,"s":4,"r":2,"q":4,"p":2,"o":5,"n":2,"m":2,"l":2,"k":2,"j":5,"i":4,"h":2,"g":4,"f":-6,"e":6,"d":5,"c":5,"a":5,";":10,":":4,".":25,"-":6,",":26}},"s":{"d":"123,-127v-17,0,-47,-25,-57,-3v2,18,47,21,57,32v50,32,15,107,-46,102v-27,-2,-67,-14,-67,-39v0,-39,50,-12,70,-8v10,2,19,-10,13,-19v-31,-19,-78,-22,-78,-67v0,-64,116,-78,128,-21v2,10,-9,23,-20,23","w":156,"k":{"t":1}},"t":{"d":"127,-159v0,20,-17,28,-41,25r0,101v7,42,-52,46,-53,9r0,-110v-21,0,-33,-7,-33,-24v0,-16,11,-25,33,-24v-7,-40,11,-80,44,-56v12,9,9,35,9,56v24,-1,41,3,41,23","w":127,"k":{"\u00e6":5,"\u00f6":5,"\u00f3":5,"\u00e9":5,"\u00e5":5,"\u00e4":5,"\u00e1":5,"o":5,"h":2,"e":5,"a":5,";":2,":":-4}},"u":{"d":"98,-47v65,0,-5,-138,55,-138v43,0,27,72,27,114v0,49,-35,75,-82,75v-45,0,-86,-27,-83,-75v2,-43,-16,-112,27,-114v60,-2,-10,138,56,138","w":195},"v":{"d":"10,-140v-18,-29,14,-57,40,-39v17,25,24,69,37,100v13,-32,21,-74,38,-100v25,-18,53,7,40,40r-45,112v-7,34,-49,40,-63,4","w":176,"k":{"\u00f8":10,"\u00e6":7,"\u00f6":7,"\u00f2":7,"\u00f3":7,"\u00ea":7,"\u00e8":7,"\u00e9":7,"\u00e5":7,"\u00e3":7,"\u00e4":7,"\u00e2":7,"\u00e0":7,"\u00e1":7,"s":7,"o":7,"l":4,"g":6,"e":7,"c":7,"a":7,":":-4,".":20,"-":-3,",":21}},"w":{"d":"8,-142v-20,-29,17,-56,40,-36v16,25,22,68,33,99v12,-32,18,-74,36,-100v17,-12,37,-5,44,18r26,82v11,-31,17,-74,33,-99v22,-19,53,3,41,37r-47,129v-17,24,-53,15,-57,-14r-23,-66v-15,33,-13,94,-53,94v-15,0,-26,-9,-33,-28","w":268,"k":{"\u00f8":7,"\u00e6":4,"\u00f6":4,"\u00f2":4,"\u00f3":4,"\u00ea":4,"\u00e8":4,"\u00e9":4,"\u00e5":4,"\u00e3":4,"\u00e4":4,"\u00e2":4,"\u00e0":4,"\u00e1":4,"s":5,"o":4,"l":1,"g":3,"e":4,"c":4,"a":4,";":-3,":":-7,".":15,"-":-5,",":17}},"x":{"d":"121,-167v14,-26,54,-19,54,10v0,24,-34,44,-48,61v16,22,48,44,55,72v1,28,-42,37,-53,10r-34,-41r-45,53v-32,17,-56,-19,-29,-48r43,-46v-14,-18,-45,-38,-48,-62v-3,-29,42,-36,54,-10r25,32","w":188,"k":{"\u00e9":6,"q":6,"o":6,"e":6,"c":6,"a":6}},"y":{"d":"9,-140v-19,-29,12,-57,37,-39v19,25,29,66,43,97v14,-31,24,-71,42,-97v23,-18,53,6,39,40r-88,206v-22,25,-57,-1,-42,-35r21,-49","w":178,"k":{"\u00f8":10,"\u00e6":7,"\u00f6":7,"\u00f2":7,"\u00f3":7,"\u00ea":7,"\u00e8":7,"\u00e9":7,"\u00e5":6,"\u00e3":6,"\u00e4":6,"\u00e2":6,"\u00e0":6,"\u00e1":6,"s":6,"o":7,"l":3,"g":6,"e":7,"c":6,"a":6,";":1,":":-4,".":20,"-":-2,",":22}},"z":{"d":"135,-183v20,0,26,22,14,38r-71,97v34,2,84,-10,84,24v0,44,-88,19,-135,24v-24,3,-34,-17,-21,-34r74,-101v-39,2,-98,4,-73,-40v28,-17,86,-8,128,-8","w":161},"{":{"d":"80,-183v-1,36,6,76,-21,86v27,11,20,50,21,87v-8,37,38,16,37,44v-1,13,-8,19,-27,19v-60,0,-58,-48,-54,-103v2,-29,-22,-22,-22,-45v-1,-25,23,-19,22,-48v-3,-55,-7,-103,55,-103v18,0,25,6,26,19v1,27,-46,7,-37,44","w":117},"|":{"d":"67,-240r46,0r0,300r-46,0r0,-300","w":180},"}":{"d":"37,-10v1,-36,-6,-77,21,-87v-28,-10,-20,-50,-21,-86v9,-38,-38,-17,-37,-44v1,-12,7,-19,27,-19v61,0,58,48,55,103v-2,31,35,29,16,62v-24,6,-15,52,-16,84v-1,38,-19,51,-56,50v-18,0,-25,-6,-26,-19v-1,-28,46,-7,37,-44","w":117},"~":{"d":"84,-224v-15,1,-20,7,-26,22r-25,-16v8,-28,26,-50,54,-50v27,-1,81,39,95,-1r26,15v-12,26,-28,48,-57,48v-7,2,-59,-19,-67,-18","w":239},"\u00c4":{"d":"44,-292v0,-14,13,-26,27,-26v14,0,26,13,26,27v0,14,-13,26,-27,26v-14,0,-26,-13,-26,-27xm122,-292v0,-14,13,-26,27,-26v14,0,26,13,26,27v0,14,-13,26,-27,26v-14,0,-26,-13,-26,-27xm213,-41v18,31,-19,58,-42,37v-8,-7,-12,-29,-16,-42r-92,0v-7,21,-9,50,-34,50v-23,0,-32,-21,-23,-45r63,-173v10,-42,66,-40,81,0xm139,-95r-29,-91r-29,91r58,0","w":218,"k":{"\u00ab":11,"y":9,"w":7,"v":9,"u":4,"t":6,"q":3,"o":3,"g":3,"d":3,"c":3,"a":3,"Y":23,"W":10,"V":17,"U":7,"T":22,"Q":8,"O":8,"G":8,"C":8,".":-5,"-":-5,",":-3}},"\u00c5":{"d":"213,-41v18,31,-19,58,-42,37v-8,-7,-12,-29,-16,-42r-92,0v-7,21,-9,50,-34,50v-23,0,-32,-21,-23,-45r63,-173v10,-42,66,-40,81,0xm139,-95r-29,-91r-29,91r58,0xm74,-295v-1,-18,17,-35,36,-35v18,0,35,16,35,35v0,20,-17,36,-36,36v-19,0,-35,-17,-35,-36xm109,-282v15,1,18,-26,1,-25v-6,0,-13,5,-13,12v0,7,5,13,12,13","w":218,"k":{"\u00ab":11,"y":9,"w":7,"v":9,"u":4,"t":6,"q":3,"o":3,"g":3,"e":3,"d":3,"c":3,"a":3,"Y":23,"W":10,"V":17,"U":7,"T":22,"Q":8,"O":8,"G":8,"C":8,".":-5,"-":-5,",":-3}},"\u00c7":{"d":"176,-59v13,-1,23,12,23,25v0,23,-35,39,-64,40r-24,50v-6,15,-34,7,-31,-9v2,-16,13,-29,19,-43v-55,-13,-94,-56,-93,-124v1,-76,44,-124,119,-126v32,-1,73,12,72,39v-3,39,-46,13,-72,13v-42,0,-60,33,-60,75v0,43,21,71,61,73v22,1,26,-11,50,-13","w":205,"k":{"A":-1}},"\u00c9":{"d":"76,-264v-15,5,-26,-4,-26,-17v8,-26,49,-27,74,-38v20,-1,26,27,5,35xm156,-215v1,34,-50,22,-84,24r0,46v33,2,79,-10,79,25v0,33,-46,22,-79,24r0,47v34,2,85,-11,84,24v0,39,-61,22,-99,25v-30,2,-40,-10,-40,-40r1,-176v5,-37,66,-21,106,-24v22,-1,32,7,32,25","w":165},"\u00d1":{"d":"59,-283v-1,-19,19,-33,37,-33v19,0,30,13,51,16v12,1,12,-19,24,-16v9,-1,15,8,16,16v0,17,-18,34,-38,33v-19,4,-45,-24,-59,-13v-1,2,-8,16,-16,14v-10,0,-16,-6,-15,-17xm228,-28v2,38,-42,41,-55,12r-101,-129r0,112v7,44,-55,48,-55,9r0,-191v-4,-28,33,-37,50,-16r106,133r0,-109v-7,-44,54,-48,55,-9r0,188","w":245},"\u00d6":{"d":"59,-292v0,-14,13,-26,27,-26v14,0,26,13,26,27v0,14,-12,26,-26,26v-15,0,-27,-12,-27,-27xm137,-292v0,-14,13,-26,27,-26v14,0,26,13,26,27v0,14,-12,26,-26,26v-15,0,-27,-12,-27,-27xm6,-122v1,-74,45,-124,119,-124v71,0,118,49,118,126v0,71,-47,126,-118,126v-71,0,-120,-54,-119,-128xm184,-120v0,-44,-19,-77,-59,-77v-38,0,-60,33,-60,74v0,45,18,80,60,80v40,0,59,-35,59,-77","w":249,"k":{"Y":13,"X":9,"W":3,"V":9,"T":10,"A":8}},"\u00dc":{"d":"53,-292v0,-14,13,-26,27,-26v14,0,26,13,26,27v0,15,-12,26,-26,26v-15,0,-27,-12,-27,-27xm131,-292v0,-14,13,-26,27,-26v14,0,26,12,26,27v0,15,-12,26,-26,26v-15,0,-27,-12,-27,-27xm168,-207v-7,-44,54,-48,55,-9r0,111v3,76,-40,111,-105,111v-59,0,-104,-37,-104,-97r0,-116v-7,-44,51,-48,55,-9v6,64,-25,170,50,170v69,0,45,-94,49,-161","w":237,"k":{"r":-1,"p":-1,"n":-1,"m":-1,"b":-2,"A":7,".":7,",":9}},"\u00e1":{"d":"186,-29v3,34,-44,43,-53,11v-45,55,-136,-6,-127,-74v-6,-67,80,-127,128,-73v6,-29,52,-24,52,7r0,129xm132,-92v0,-25,-14,-46,-37,-45v-22,0,-36,21,-36,45v0,25,12,47,36,46v23,0,37,-21,37,-46xm94,-205v-19,7,-34,-15,-21,-29v20,-12,45,-22,70,-29v20,0,24,28,4,36","w":201,"k":{"y":4,"w":2,"v":4}},"\u00e0":{"d":"186,-29v3,34,-44,43,-53,11v-45,55,-136,-6,-127,-74v-6,-67,80,-127,128,-73v6,-29,52,-24,52,7r0,129xm132,-92v0,-25,-14,-46,-37,-45v-22,0,-36,21,-36,45v0,25,12,47,36,46v23,0,37,-21,37,-46xm125,-240v21,6,17,39,-4,36v-24,-3,-40,-16,-61,-23v-20,-6,-17,-38,4,-36v23,2,40,17,61,23","w":201,"k":{"y":4,"w":2,"v":4}},"\u00e2":{"d":"154,-239v20,7,15,34,-5,35v-19,-3,-30,-15,-46,-22v-18,9,-55,39,-63,4v7,-25,42,-30,64,-41v20,5,32,17,50,24xm186,-29v3,34,-44,43,-53,11v-45,55,-136,-6,-127,-74v-6,-67,80,-127,128,-73v6,-29,52,-24,52,7r0,129xm132,-92v0,-25,-14,-46,-37,-45v-22,0,-36,21,-36,45v0,25,12,47,36,46v23,0,37,-21,37,-46","w":201},"\u00e4":{"d":"186,-29v3,34,-44,43,-53,11v-45,55,-136,-6,-127,-74v-6,-67,80,-127,128,-73v6,-29,52,-24,52,7r0,129xm132,-92v0,-25,-14,-46,-37,-45v-22,0,-36,21,-36,45v0,25,12,47,36,46v23,0,37,-21,37,-46xm38,-233v0,-15,13,-26,27,-26v14,0,26,12,26,26v0,15,-12,27,-27,27v-14,0,-26,-12,-26,-27xm116,-233v0,-15,13,-26,27,-26v14,0,26,12,26,26v0,15,-12,27,-27,27v-14,0,-26,-13,-26,-27","w":201,"k":{"y":4,"w":2,"v":4}},"\u00e3":{"d":"38,-224v-1,-19,19,-33,37,-33v19,0,30,13,52,16v11,1,11,-19,23,-16v9,-1,16,7,16,16v1,17,-18,34,-38,33v-17,3,-44,-25,-58,-13v-1,14,-32,21,-32,-3xm186,-29v3,34,-44,43,-53,11v-45,55,-136,-6,-127,-74v-6,-67,80,-127,128,-73v6,-29,52,-24,52,7r0,129xm132,-92v0,-25,-14,-46,-37,-45v-22,0,-36,21,-36,45v0,25,12,47,36,46v23,0,37,-21,37,-46","w":201},"\u00e5":{"d":"186,-29v3,34,-44,43,-53,11v-45,55,-136,-6,-127,-74v-6,-67,80,-127,128,-73v6,-29,52,-24,52,7r0,129xm132,-92v0,-25,-14,-46,-37,-45v-22,0,-36,21,-36,45v0,25,12,47,36,46v23,0,37,-21,37,-46xm67,-239v0,-19,17,-35,36,-35v18,0,34,17,34,36v0,20,-16,35,-35,35v-19,1,-35,-17,-35,-36xm116,-238v0,-17,-27,-18,-28,0v0,7,6,13,14,13v7,0,14,-6,14,-13","w":201,"k":{"y":4,"w":2,"v":4}},"\u00e7":{"d":"99,-46v22,-5,57,-19,58,15v1,19,-30,32,-51,34r-25,53v-7,15,-33,7,-32,-9v5,-16,15,-31,21,-46v-38,-12,-64,-45,-64,-91v0,-58,35,-96,91,-96v27,0,60,7,60,35v0,34,-36,20,-59,14v-22,0,-39,21,-39,46v0,27,16,45,40,45","w":164},"\u00e9":{"d":"97,-186v50,0,87,37,87,91v0,14,-8,21,-23,21r-98,0v9,37,56,37,85,17v15,-10,33,4,33,19v-2,26,-48,42,-79,42v-53,0,-95,-37,-96,-92v-1,-55,39,-98,91,-98xm132,-110v-2,-32,-39,-43,-59,-22v-4,5,-9,12,-12,22r71,0xm88,-205v-19,7,-34,-15,-21,-29v20,-12,45,-22,70,-29v20,0,24,28,4,36","w":190,"k":{"y":7,"w":4,"v":6}},"\u00e8":{"d":"97,-186v50,0,87,37,87,91v0,14,-8,21,-23,21r-98,0v9,37,56,37,85,17v15,-10,33,4,33,19v-2,26,-48,42,-79,42v-53,0,-95,-37,-96,-92v-1,-55,39,-98,91,-98xm132,-110v-2,-32,-39,-43,-59,-22v-4,5,-9,12,-12,22r71,0xm121,-240v21,6,17,39,-4,36v-24,-3,-40,-16,-61,-23v-20,-6,-17,-38,4,-36v23,2,40,17,61,23","w":190},"\u00ea":{"d":"146,-239v20,8,14,35,-6,35v-18,-4,-29,-15,-45,-22v-18,9,-55,39,-63,4v6,-26,42,-29,63,-41v21,4,33,17,51,24xm97,-186v50,0,87,37,87,91v0,14,-8,21,-23,21r-98,0v9,37,56,37,85,17v15,-10,33,4,33,19v-2,26,-48,42,-79,42v-53,0,-95,-37,-96,-92v-1,-55,39,-98,91,-98xm132,-110v-2,-32,-39,-43,-59,-22v-4,5,-9,12,-12,22r71,0","w":190,"k":{"y":7,"w":4,"v":6}},"\u00eb":{"d":"97,-186v50,0,87,37,87,91v0,14,-8,21,-23,21r-98,0v9,37,56,37,85,17v15,-10,33,4,33,19v-2,26,-48,42,-79,42v-53,0,-95,-37,-96,-92v-1,-55,39,-98,91,-98xm132,-110v-2,-32,-39,-43,-59,-22v-4,5,-9,12,-12,22r71,0xm30,-233v0,-15,13,-26,27,-26v14,0,26,12,26,26v0,15,-12,27,-27,27v-14,0,-26,-12,-26,-27xm108,-233v0,-15,13,-26,27,-26v14,0,26,12,26,26v0,15,-12,27,-27,27v-14,0,-26,-13,-26,-27","w":190},"\u00ed":{"d":"72,-33v5,31,-23,43,-44,29v-19,-33,-3,-99,-9,-146v-5,-41,53,-46,53,-9r0,126xm94,-234v-18,12,-65,52,-75,13v8,-25,40,-31,62,-43v14,0,23,18,13,30","w":92},"\u00ec":{"d":"73,-33v5,31,-23,44,-44,29v-19,-33,-3,-99,-9,-146v-5,-41,53,-46,53,-9r0,126xm59,-240v19,7,18,35,-3,37v-23,-6,-43,-21,-59,-33v-8,-15,7,-34,22,-26","w":92},"\u00ee":{"d":"72,-33v5,31,-23,44,-44,29v-19,-33,-3,-99,-9,-146v-5,-41,53,-46,53,-9r0,126xm94,-235v15,10,1,38,-19,30r-29,-21v-14,13,-47,36,-54,4v7,-24,34,-29,54,-41v19,6,32,18,48,28","w":92},"\u00ef":{"d":"14,-207v-36,-1,-29,-51,1,-51v12,-1,25,13,25,25v1,13,-13,26,-26,26xm78,-207v-36,-1,-30,-51,1,-51v12,0,24,12,24,25v0,14,-12,26,-25,26xm72,-33v5,31,-23,43,-44,29v-19,-33,-3,-99,-9,-146v-5,-41,53,-46,53,-9r0,126","w":92},"\u00f1":{"d":"34,-224v-1,-19,19,-33,37,-33v19,0,30,13,52,16v11,1,11,-19,23,-16v9,-1,16,7,16,16v1,17,-18,34,-38,33v-17,3,-44,-25,-58,-13v-1,14,-32,21,-32,-3xm15,-154v-3,-33,42,-42,52,-12v36,-40,123,-18,114,47v-6,44,18,121,-27,121v-61,0,11,-143,-56,-143v-43,0,-27,65,-30,108v5,31,-23,43,-44,29v-19,-34,-5,-101,-9,-150","w":196},"\u00f3":{"d":"6,-92v1,-55,36,-94,89,-94v52,0,88,39,88,95v0,54,-34,95,-88,95v-53,0,-89,-39,-89,-96xm131,-91v0,-25,-13,-45,-37,-46v-21,-1,-35,21,-35,45v0,25,14,46,35,46v22,1,37,-22,37,-45xm88,-205v-19,7,-34,-15,-21,-29v20,-12,45,-22,70,-29v20,0,24,28,4,36","w":189,"k":{"y":7,"w":5,"v":7}},"\u00f2":{"d":"6,-92v1,-55,36,-94,89,-94v52,0,88,39,88,95v0,54,-34,95,-88,95v-53,0,-89,-39,-89,-96xm131,-91v0,-25,-13,-45,-37,-46v-21,-1,-35,21,-35,45v0,25,14,46,35,46v22,1,37,-22,37,-45xm115,-240v21,6,17,39,-4,36v-24,-3,-40,-16,-61,-23v-20,-6,-17,-38,4,-36v23,2,40,17,61,23","w":189,"k":{"y":7,"w":5,"v":7}},"\u00f4":{"d":"145,-239v20,7,15,34,-5,35v-19,-3,-29,-15,-45,-22v-18,9,-55,39,-64,4v7,-25,43,-29,64,-41v20,5,32,17,50,24xm6,-92v1,-55,36,-94,89,-94v52,0,88,39,88,95v0,54,-34,95,-88,95v-53,0,-89,-39,-89,-96xm131,-91v0,-25,-13,-45,-37,-46v-21,-1,-35,21,-35,45v0,25,14,46,35,46v22,1,37,-22,37,-45","w":189,"k":{"t":5}},"\u00f6":{"d":"6,-92v1,-55,36,-94,89,-94v52,0,88,39,88,95v0,54,-34,95,-88,95v-53,0,-89,-39,-89,-96xm131,-91v0,-25,-13,-45,-37,-46v-21,-1,-35,21,-35,45v0,25,14,46,35,46v22,1,37,-22,37,-45xm30,-233v0,-15,13,-26,27,-26v14,0,26,12,26,26v0,15,-12,27,-27,27v-14,0,-26,-12,-26,-27xm108,-233v0,-15,13,-26,27,-26v14,0,26,12,26,26v0,15,-12,27,-27,27v-14,0,-26,-13,-26,-27","w":189,"k":{"y":7,"x":7,"w":5,"v":7,"t":5}},"\u00f5":{"d":"32,-224v-1,-19,19,-33,37,-33v19,0,30,13,52,16v11,1,11,-19,23,-16v9,-1,16,7,16,16v1,17,-18,34,-38,33v-17,3,-44,-25,-58,-13v-1,14,-32,21,-32,-3xm6,-92v1,-55,36,-94,89,-94v52,0,88,39,88,95v0,54,-34,95,-88,95v-53,0,-89,-39,-89,-96xm131,-91v0,-25,-13,-45,-37,-46v-21,-1,-35,21,-35,45v0,25,14,46,35,46v22,1,37,-22,37,-45","w":189},"\u00fa":{"d":"98,-47v65,0,-5,-138,55,-138v43,0,27,72,27,114v0,49,-35,75,-82,75v-45,0,-86,-27,-83,-75v2,-43,-16,-112,27,-114v60,-2,-10,138,56,138xm93,-205v-19,7,-34,-15,-21,-29v20,-12,45,-22,70,-29v20,0,24,28,4,36","w":195},"\u00f9":{"d":"98,-47v65,0,-5,-138,55,-138v43,0,27,72,27,114v0,49,-35,75,-82,75v-45,0,-86,-27,-83,-75v2,-43,-16,-112,27,-114v60,-2,-10,138,56,138xm118,-240v21,6,17,39,-4,36v-24,-3,-40,-16,-61,-23v-20,-6,-17,-38,4,-36v23,2,40,17,61,23","w":195},"\u00fb":{"d":"148,-239v20,7,15,34,-5,35v-19,-3,-29,-15,-45,-22v-18,9,-56,39,-64,4v7,-25,42,-30,64,-41v20,5,32,17,50,24xm98,-47v65,0,-5,-138,55,-138v43,0,27,72,27,114v0,49,-35,75,-82,75v-45,0,-86,-27,-83,-75v2,-43,-16,-112,27,-114v60,-2,-10,138,56,138","w":195},"\u00fc":{"d":"98,-47v65,0,-5,-138,55,-138v43,0,27,72,27,114v0,49,-35,75,-82,75v-45,0,-86,-27,-83,-75v2,-43,-16,-112,27,-114v60,-2,-10,138,56,138xm33,-233v0,-15,13,-26,27,-26v14,0,26,12,26,26v0,15,-12,27,-27,27v-14,0,-26,-12,-26,-27xm111,-233v0,-15,13,-26,27,-26v14,0,26,12,26,26v0,15,-12,27,-27,27v-14,0,-26,-13,-26,-27","w":195},"\u00b0":{"d":"19,-187v0,-29,27,-53,55,-53v29,0,56,26,56,54v0,30,-26,55,-56,55v-30,0,-55,-26,-55,-56xm102,-186v0,-16,-14,-27,-28,-27v-15,0,-28,12,-28,27v0,16,13,28,28,28v15,0,28,-12,28,-28","w":148},"\u00a2":{"d":"103,-249v15,0,20,15,18,35v30,6,45,18,45,35v0,34,-34,20,-62,15v-24,1,-38,20,-38,45v0,26,17,44,40,45v7,0,23,-8,38,-9v12,-1,21,12,21,24v-2,23,-22,29,-44,34v1,20,-1,37,-18,37v-16,0,-20,-17,-18,-37v-44,-9,-74,-43,-73,-93v1,-51,29,-88,73,-96v-1,-20,1,-36,18,-35","w":177},"\u00a3":{"d":"160,-121v0,24,-21,26,-48,25v0,15,-4,25,-14,45v42,5,118,-17,118,26v0,17,-13,25,-34,25r-124,0v-17,0,-31,-9,-31,-26v0,-30,29,-35,28,-70v-27,1,-50,0,-50,-25v0,-19,15,-29,39,-26v-25,-59,24,-101,84,-99v43,0,82,18,87,59v1,15,-15,27,-29,27v-26,0,-29,-39,-58,-37v-27,1,-39,26,-22,50v29,-1,55,-1,54,26","w":220},"\u00a7":{"d":"33,-4v25,5,77,35,83,-6v-15,-47,-101,-27,-101,-92v0,-19,7,-33,20,-43v-34,-44,9,-104,66,-100v28,2,64,8,64,33v0,48,-80,-15,-89,28v23,43,104,27,102,95v0,18,-6,33,-19,44v28,48,-10,105,-69,101v-32,-2,-76,-7,-79,-37v0,-11,11,-23,22,-23xm69,-128v-27,39,28,49,56,62v21,-40,-23,-53,-56,-62"},"\u00b6":{"d":"144,49v-15,-1,-20,-11,-20,-32r0,-214r-19,0r0,214v0,19,-4,30,-20,32v-15,-1,-20,-11,-20,-32r0,-112v-44,4,-65,-32,-65,-72v0,-39,20,-76,63,-73v43,3,101,-20,101,36r0,221v1,21,-4,30,-20,32"},"\u00df":{"d":"97,-264v62,0,103,82,52,118v76,25,36,155,-36,150v-27,4,-41,-28,-23,-44v18,-7,50,-14,46,-43v6,-40,-56,-24,-56,-59v0,-29,40,-21,40,-48v0,-13,-10,-26,-25,-25v-21,1,-27,15,-27,40r0,142v5,31,-23,43,-44,29v-20,-42,-6,-120,-9,-177v-3,-49,33,-83,82,-83","w":197},"\u00ae":{"d":"192,-82v14,12,8,32,-10,31v-23,-8,-37,-38,-54,-54v-1,23,7,54,-17,54v-12,0,-18,-7,-18,-22r0,-93v-3,-29,27,-24,54,-24v54,0,71,72,19,81xm163,-145v1,-16,-18,-16,-35,-15r0,29v16,1,35,1,35,-14xm19,-120v0,-73,51,-125,127,-125v70,0,123,53,123,125v0,71,-51,125,-125,125v-72,0,-125,-52,-125,-125xm242,-120v-2,-56,-39,-99,-96,-101v-55,-2,-101,47,-100,101v2,57,41,99,98,101v53,2,99,-48,98,-101","w":287},"\u00a9":{"d":"81,-122v1,-43,28,-70,72,-71v23,0,41,5,43,23v-2,22,-28,12,-43,8v-23,1,-35,16,-35,41v0,38,33,47,65,33v7,0,14,7,14,15v-1,18,-25,23,-44,24v-43,1,-73,-31,-72,-73xm19,-120v0,-73,51,-125,127,-125v70,0,123,53,123,125v0,71,-51,125,-125,125v-72,0,-125,-52,-125,-125xm242,-120v-2,-56,-39,-99,-96,-101v-55,-2,-101,47,-100,101v2,57,41,99,98,101v53,2,99,-48,98,-101","w":287},"\u00b4":{"d":"83,-205v-19,7,-34,-15,-21,-29v20,-12,45,-22,70,-29v20,0,24,28,4,36","w":180},"\u00a8":{"d":"25,-233v0,-15,13,-26,27,-26v14,0,26,12,26,26v0,15,-12,27,-27,27v-14,0,-26,-12,-26,-27xm103,-233v0,-15,13,-26,27,-26v14,0,26,12,26,26v0,15,-12,27,-27,27v-14,0,-26,-13,-26,-27","w":180},"\u00c6":{"d":"274,-215v1,35,-52,21,-86,24r0,45v34,1,81,-9,81,25v-1,32,-47,23,-81,24r0,48v34,3,86,-11,86,24v0,39,-61,25,-99,25v-31,0,-42,-11,-42,-41r-63,0v-8,18,-12,46,-35,45v-23,-1,-31,-21,-21,-45r78,-180v7,-14,11,-19,31,-19r119,0v22,-1,31,7,32,25xm133,-90r0,-98r-41,98r41,0","w":284},"\u00d8":{"d":"6,-120v-6,-97,98,-156,181,-110v6,-8,13,-20,26,-20v28,0,23,35,6,48v57,77,9,217,-95,208v-27,-2,-42,-6,-63,-18v-7,8,-13,18,-25,18v-29,0,-22,-35,-6,-48v-18,-23,-22,-42,-24,-78xm95,-52v61,35,113,-36,87,-106xm153,-190v-61,-29,-112,37,-86,104","w":249,"k":{"A":7}},"\u00b1":{"d":"96,-59v-25,0,-15,-38,-17,-62v-25,-2,-67,9,-67,-17v0,-26,42,-15,67,-17v3,-26,-10,-69,17,-69v27,0,14,44,17,69v25,2,67,-9,67,17v0,26,-42,14,-67,17v-2,24,8,62,-17,62xm180,-27v0,13,-9,17,-24,16r-122,0v-14,1,-22,-4,-22,-16v0,-12,7,-17,22,-17r124,0v14,-1,22,5,22,17"},"\u00a5":{"d":"122,-33v7,42,-52,46,-53,9r0,-50v-21,-1,-56,6,-56,-15v0,-21,34,-15,55,-16r-11,-19v-19,0,-45,2,-44,-16v1,-12,12,-16,27,-15v-10,-22,-28,-37,-30,-65v0,-12,13,-23,27,-24v17,-1,23,15,28,25r29,64r3,0r31,-69v8,-29,53,-23,53,5v0,26,-20,44,-29,64v15,-1,28,3,27,15v0,18,-24,16,-44,16r-11,19v21,1,55,-6,55,15v0,23,-35,15,-57,16r0,41"},"\u00b5":{"d":"178,-71v3,58,-55,86,-111,70v-1,33,7,76,-27,75v-18,0,-26,-14,-26,-35r0,-189v-1,-24,7,-35,26,-35v61,0,-9,134,56,138v63,4,-6,-129,56,-138v42,2,24,72,26,114"},"\u00aa":{"d":"125,-190v-3,33,15,95,-18,95v-8,0,-13,-3,-17,-11v-30,31,-87,-4,-81,-46v-4,-41,48,-74,81,-45v7,-18,37,-12,35,7xm88,-151v0,-14,-8,-26,-22,-26v-14,0,-22,12,-22,26v0,15,9,26,22,26v13,0,23,-12,22,-26","w":139},"\u00ba":{"d":"9,-152v0,-33,26,-56,57,-56v32,0,57,26,57,57v0,31,-25,57,-57,57v-33,0,-57,-24,-57,-58xm65,-125v29,0,31,-52,0,-52v-12,0,-21,12,-21,26v0,14,9,26,21,26","w":131},"\u00e6":{"d":"133,-166v-3,-24,38,-26,41,-6v55,-39,133,10,132,77v0,15,-8,19,-25,19r-97,0v12,42,60,29,96,18v12,0,25,9,23,21v-7,44,-98,54,-129,23v0,11,-7,16,-21,16v-14,0,-20,-6,-20,-21v-45,54,-133,-1,-127,-74v4,-51,32,-93,83,-93v22,0,33,5,44,20xm254,-111v-7,-45,-66,-42,-71,0r71,0xm131,-93v0,-25,-13,-43,-36,-44v-22,0,-36,21,-36,45v-1,25,12,46,35,46v24,-1,38,-20,37,-47","w":312,"k":{"y":7,"w":4,"v":7}},"\u00f8":{"d":"27,-40v-47,-82,37,-182,125,-133v12,-20,40,-17,43,7v1,6,-9,16,-14,23v46,81,-39,186,-125,133v-12,19,-41,17,-42,-8v0,-6,8,-15,13,-22xm87,-46v35,18,68,-20,56,-63xm120,-136v-36,-19,-70,23,-54,62","w":208},"\u00bf":{"d":"63,-217v-1,-15,15,-29,30,-29v14,0,29,14,29,29v0,16,-14,30,-30,30v-16,0,-29,-14,-29,-30xm6,-70v-1,-37,27,-63,60,-70v-2,-21,9,-33,26,-34v26,-2,26,25,26,52v0,34,-58,18,-53,51v-1,14,13,22,27,23v22,2,28,-31,51,-31v14,0,26,11,25,25v0,33,-42,62,-78,60v-47,-3,-83,-27,-84,-76","w":173},"\u00a1":{"d":"17,-217v0,-15,15,-29,30,-29v14,0,28,13,28,29v0,16,-13,30,-29,30v-16,0,-29,-13,-29,-30xm46,-169v47,5,20,92,26,140v3,24,-8,32,-26,35v-47,-5,-20,-92,-26,-140v-3,-24,8,-32,26,-35","w":92},"\u00ac":{"d":"122,0r0,-53r-110,0r0,-43r156,0r0,96r-46,0","w":180},"\u00ab":{"d":"59,-162v11,-19,44,-11,41,12v-3,25,-29,35,-41,52v13,17,38,28,41,53v3,22,-30,32,-41,12v-13,-25,-55,-52,-30,-87xm146,-162v11,-19,44,-10,41,12v-3,24,-29,35,-42,52v13,17,36,29,42,53v0,21,-30,32,-41,12v-14,-25,-57,-53,-31,-87","w":206},"\u00bb":{"d":"147,-33v-11,20,-41,10,-41,-12v5,-24,29,-36,42,-53v-13,-17,-36,-28,-42,-52v0,-21,30,-32,41,-12v14,25,57,52,31,87xm61,-33v-11,19,-43,10,-41,-12v2,-25,29,-36,42,-53v-13,-17,-39,-27,-42,-52v-3,-22,30,-32,41,-12v13,26,55,52,30,87","w":206,"k":{"\u00c1":11,"\u00c6":17,"\u00c5":11,"\u00c4":11,"Y":32,"W":14,"V":23,"T":29,"A":11}},"\u00c0":{"d":"129,-298v22,6,18,35,-3,35v-24,0,-41,-15,-62,-21v-21,-5,-15,-35,5,-35v22,5,39,15,60,21xm213,-41v18,31,-19,58,-42,37v-8,-7,-12,-29,-16,-42r-92,0v-7,21,-9,50,-34,50v-23,0,-32,-21,-23,-45r63,-173v10,-42,66,-40,81,0xm139,-95r-29,-91r-29,91r58,0","w":218,"k":{"Y":23,"W":10,"V":17,"U":7,"T":22,"Q":8,"O":8,"G":8,"C":8,".":-5,",":-3}},"\u00c3":{"d":"45,-283v-1,-19,19,-33,38,-33v19,0,30,13,51,16v12,1,12,-19,24,-16v9,-1,15,8,15,16v0,17,-17,34,-37,33v-19,4,-45,-24,-59,-13v-1,2,-8,16,-16,14v-10,0,-16,-7,-16,-17xm213,-41v18,31,-19,58,-42,37v-8,-7,-12,-29,-16,-42r-92,0v-7,21,-9,50,-34,50v-23,0,-32,-21,-23,-45r63,-173v10,-42,66,-40,81,0xm139,-95r-29,-91r-29,91r58,0","w":218,"k":{"Y":23,"W":10,"V":17,"U":7,"T":22,"Q":8,"O":8,"G":8,"C":8,".":-5,",":-3}},"\u00d5":{"d":"62,-283v0,-19,19,-33,37,-33v19,0,30,13,51,16v12,1,12,-19,24,-16v9,-1,16,7,16,16v1,17,-18,34,-38,33v-18,3,-46,-24,-58,-13v-1,2,-8,16,-16,14v-10,0,-16,-6,-16,-17xm6,-122v1,-74,45,-124,119,-124v71,0,118,49,118,126v0,71,-47,126,-118,126v-71,0,-120,-54,-119,-128xm184,-120v0,-44,-19,-77,-59,-77v-38,0,-60,33,-60,74v0,45,18,80,60,80v40,0,59,-35,59,-77","w":249,"k":{"Y":13,"V":9,"T":10}},"\u00f7":{"d":"69,-56v0,-14,13,-26,27,-26v14,0,27,12,27,27v0,14,-13,27,-27,27v-16,0,-27,-12,-27,-28xm69,-188v0,-14,13,-26,27,-26v14,0,27,12,27,27v0,14,-13,27,-27,27v-15,0,-27,-12,-27,-28xm180,-121v0,13,-9,17,-24,16r-122,0v-14,1,-22,-4,-22,-16v0,-12,7,-17,22,-17r124,0v14,-1,22,5,22,17"},"\u00ff":{"d":"9,-140v-19,-29,12,-57,37,-39v19,25,29,66,43,97v14,-31,24,-71,42,-97v23,-18,53,6,39,40r-88,206v-22,25,-57,-1,-42,-35r21,-49xm24,-233v0,-15,13,-26,27,-26v14,0,26,12,26,26v0,15,-12,27,-27,27v-14,0,-26,-12,-26,-27xm102,-233v0,-15,13,-26,27,-26v14,0,26,12,26,26v0,15,-12,27,-27,27v-14,0,-26,-13,-26,-27","w":178},"\u00c2":{"d":"160,-298v21,6,14,37,-5,35v-18,-2,-30,-13,-46,-19v-19,8,-56,35,-63,1v8,-24,43,-34,70,-37xm213,-41v18,31,-19,58,-42,37v-8,-7,-12,-29,-16,-42r-92,0v-7,21,-9,50,-34,50v-23,0,-32,-21,-23,-45r63,-173v10,-42,66,-40,81,0xm139,-95r-29,-91r-29,91r58,0","w":218,"k":{"Y":23,"W":10,"V":17,"U":7,"T":22,"Q":8,"O":8,"G":8,"C":8,".":-5,",":-3}},"\u00ca":{"d":"136,-298v21,6,14,37,-5,35v-18,-2,-30,-13,-46,-19v-19,8,-56,35,-63,1v8,-24,43,-34,70,-37xm156,-215v1,34,-50,22,-84,24r0,46v33,2,79,-10,79,25v0,33,-46,22,-79,24r0,47v34,2,85,-11,84,24v0,39,-61,22,-99,25v-30,2,-40,-10,-40,-40r1,-176v5,-37,66,-21,106,-24v22,-1,32,7,32,25","w":165},"\u00c1":{"d":"102,-264v-15,5,-26,-4,-26,-17v7,-27,50,-26,74,-38v20,-2,27,27,6,35xm213,-41v18,31,-19,58,-42,37v-8,-7,-12,-29,-16,-42r-92,0v-7,21,-9,50,-34,50v-23,0,-32,-21,-23,-45r63,-173v10,-42,66,-40,81,0xm139,-95r-29,-91r-29,91r58,0","w":218,"k":{"\u00ab":11,"y":9,"w":7,"v":9,"u":4,"t":6,"q":3,"o":3,"g":3,"e":3,"d":3,"c":3,"a":3,"Y":23,"W":10,"V":17,"U":7,"T":22,"Q":8,"O":8,"G":8,"C":8,".":-5,"-":-5,",":-3}},"\u00cb":{"d":"20,-292v0,-14,13,-26,27,-26v14,0,26,13,26,27v0,14,-13,26,-27,26v-14,0,-26,-13,-26,-27xm98,-292v0,-14,13,-26,27,-26v14,0,26,13,26,27v0,14,-13,26,-27,26v-14,0,-26,-13,-26,-27xm156,-215v1,34,-50,22,-84,24r0,46v33,2,79,-10,79,25v0,33,-46,22,-79,24r0,47v34,2,85,-11,84,24v0,39,-61,22,-99,25v-30,2,-40,-10,-40,-40r1,-176v5,-37,66,-21,106,-24v22,-1,32,7,32,25","w":165},"\u00c8":{"d":"107,-298v22,6,16,35,-4,35v-24,0,-41,-15,-62,-21v-21,-5,-15,-35,5,-35v22,5,40,15,61,21xm156,-215v1,34,-50,22,-84,24r0,46v33,2,79,-10,79,25v0,33,-46,22,-79,24r0,47v34,2,85,-11,84,24v0,39,-61,22,-99,25v-30,2,-40,-10,-40,-40r1,-176v5,-37,66,-21,106,-24v22,-1,32,7,32,25","w":165},"\u00cd":{"d":"72,-33v7,44,-55,48,-55,9r0,-183v-1,-25,7,-37,27,-37v19,0,28,15,28,37r0,174xm43,-264v-19,7,-34,-15,-21,-29v19,-8,35,-20,57,-26v20,-1,27,30,5,35","w":88},"\u00ce":{"d":"72,-33v7,44,-55,48,-55,9r0,-183v-1,-24,7,-37,27,-37v19,0,28,15,28,37r0,174xm85,-298v21,6,15,37,-5,35v-16,-2,-23,-13,-36,-19v-15,19,-65,27,-49,-10v15,-10,32,-28,56,-26","w":88},"\u00cf":{"d":"-13,-291v0,-13,11,-25,25,-25v13,0,25,13,25,25v1,13,-13,25,-25,25v-13,1,-25,-11,-25,-25xm52,-291v0,-13,11,-25,25,-25v13,0,25,13,25,25v1,13,-13,25,-25,25v-14,1,-25,-11,-25,-25xm72,-33v7,44,-55,48,-55,9r0,-183v-1,-25,7,-37,27,-37v19,0,28,15,28,37r0,174","w":88},"\u00cc":{"d":"72,-33v7,44,-55,48,-55,9r0,-183v-1,-25,7,-37,27,-37v19,0,28,15,28,37r0,174xm58,-298v21,7,16,36,-5,35v-24,-9,-53,-14,-62,-38v6,-34,47,-4,67,3","w":88},"\u00d3":{"d":"118,-264v-15,5,-27,-4,-27,-17v8,-26,50,-27,75,-38v19,-1,25,27,5,35xm6,-122v1,-74,45,-124,119,-124v71,0,118,49,118,126v0,71,-47,126,-118,126v-71,0,-120,-54,-119,-128xm184,-120v0,-44,-19,-77,-59,-77v-38,0,-60,33,-60,74v0,45,18,80,60,80v40,0,59,-35,59,-77","w":249,"k":{"Y":13,"W":3,"V":9,"T":10,"A":8}},"\u00d4":{"d":"175,-298v21,6,14,37,-5,35v-18,-2,-30,-13,-45,-19v-19,8,-57,35,-64,1v8,-24,43,-34,70,-37xm6,-122v1,-74,45,-124,119,-124v71,0,118,49,118,126v0,71,-47,126,-118,126v-71,0,-120,-54,-119,-128xm184,-120v0,-44,-19,-77,-59,-77v-38,0,-60,33,-60,74v0,45,18,80,60,80v40,0,59,-35,59,-77","w":249,"k":{"Y":13,"V":9,"T":10}},"\u00d2":{"d":"147,-298v22,6,18,35,-4,35v-24,0,-40,-15,-61,-21v-21,-6,-16,-35,5,-35v22,5,39,15,60,21xm6,-122v1,-74,45,-124,119,-124v71,0,118,49,118,126v0,71,-47,126,-118,126v-71,0,-120,-54,-119,-128xm184,-120v0,-44,-19,-77,-59,-77v-38,0,-60,33,-60,74v0,45,18,80,60,80v40,0,59,-35,59,-77","w":249,"k":{"Y":13,"V":9,"T":10}},"\u00da":{"d":"165,-284v-25,7,-71,40,-80,3v8,-26,50,-27,75,-38v20,-1,27,30,5,35xm168,-207v-7,-44,54,-48,55,-9r0,111v3,76,-40,111,-105,111v-59,0,-104,-37,-104,-97r0,-116v-7,-44,51,-48,55,-9v6,64,-25,170,50,170v69,0,45,-94,49,-161","w":237,"k":{"r":-1,"p":-1,"n":-1,"m":-1,"A":7,".":7,",":9}},"\u00db":{"d":"169,-298v25,8,10,44,-11,34r-39,-18v-19,8,-56,35,-64,1v8,-24,44,-34,70,-37xm168,-207v-7,-44,54,-48,55,-9r0,111v3,76,-40,111,-105,111v-59,0,-104,-37,-104,-97r0,-116v-7,-44,51,-48,55,-9v6,64,-25,170,50,170v69,0,45,-94,49,-161","w":237,"k":{"A":7}},"\u00d9":{"d":"140,-298v22,6,18,35,-4,35v-24,0,-40,-15,-61,-21v-21,-6,-16,-35,5,-35v22,5,39,15,60,21xm168,-207v-7,-44,54,-48,55,-9r0,111v3,76,-40,111,-105,111v-59,0,-104,-37,-104,-97r0,-116v-7,-44,51,-48,55,-9v6,64,-25,170,50,170v69,0,45,-94,49,-161","w":237,"k":{"A":7}},"\u00b8":{"d":"89,56v-6,14,-35,8,-32,-9v3,-17,15,-32,21,-47r37,0","w":180},"\u00a0":{"w":90},"\u00a4":{"d":"25,-186v2,-23,29,-25,42,-8v27,-15,61,-15,87,0v14,-17,39,-15,41,9v1,5,-5,14,-12,20v17,27,17,61,1,89v19,13,12,39,-9,40v-5,0,-11,-4,-19,-11v-30,17,-63,16,-91,-1v-13,20,-39,13,-40,-9v0,-5,4,-11,12,-19v-16,-28,-16,-62,1,-89v-7,-6,-14,-15,-13,-21xm155,-120v0,-25,-21,-45,-44,-45v-25,0,-45,21,-45,45v0,24,22,45,45,45v23,0,44,-22,44,-45","w":220},"\u00a6":{"d":"67,-240r46,0r0,125r-46,0r0,-125xm67,-55r46,0r0,115r-46,0r0,-115","w":180},"\u00ad":{"d":"30,-77v-36,6,-39,-45,-8,-45v30,0,67,-7,67,23v0,25,-31,23,-59,22","w":88},"\u00af":{"d":"0,-300r180,0r0,41r-180,0r0,-41","w":180},"\u00b2":{"d":"120,-200v-3,37,-20,43,-48,73v20,1,54,-5,52,15v-3,28,-58,16,-87,16v-12,0,-20,-5,-20,-15v0,-24,61,-55,65,-88v1,-8,-7,-12,-13,-12v-19,-1,-13,33,-33,32v-10,-1,-17,-6,-17,-17v-1,-25,24,-47,52,-47v25,0,51,17,49,43","w":140},"\u00b3":{"d":"20,-209v4,-46,98,-45,96,5v-1,12,-4,24,-16,28v46,22,19,84,-30,84v-28,0,-55,-16,-55,-41v0,-8,9,-16,18,-16v17,0,16,26,35,24v10,-1,19,-6,18,-17v3,-20,-40,-10,-36,-30v-3,-19,32,-13,31,-29v-9,-25,-33,6,-45,7v-9,1,-17,-6,-16,-15","w":140},"\u00b7":{"d":"9,-108v-1,-15,15,-29,30,-29v14,-1,29,14,29,29v0,16,-14,30,-30,30v-16,0,-29,-14,-29,-30","w":76},"\u00b9":{"d":"75,-94v-14,0,-18,-8,-18,-23r0,-92v-15,1,-28,-3,-28,-15v0,-17,22,-16,41,-16v16,0,24,7,24,22r0,101v0,14,-6,23,-19,23","w":140},"\u00bc":{"d":"75,-94v-14,0,-18,-8,-18,-23r0,-92v-15,1,-28,-3,-28,-15v0,-17,22,-16,41,-16v16,0,24,7,24,22r0,101v0,14,-6,23,-19,23xm137,-9v-7,20,-34,20,-35,-1v25,-76,58,-146,86,-220v2,-21,35,-20,35,0v-24,77,-61,146,-86,221xm276,2v-16,0,-19,-14,-18,-32v-25,-2,-77,6,-60,-23r45,-77v10,-25,50,-19,50,9v0,19,-4,45,2,60v10,0,17,6,17,15v0,10,-8,16,-19,16v1,18,-1,33,-17,32xm258,-61r0,-39r-22,39r22,0","w":324},"\u00bd":{"d":"75,-94v-14,0,-18,-8,-18,-23r0,-92v-15,1,-28,-3,-28,-15v0,-17,22,-16,41,-16v16,0,24,7,24,22r0,101v0,14,-6,23,-19,23xm137,-9v-7,20,-34,20,-35,-1v25,-76,58,-146,86,-220v2,-21,35,-20,35,0v-24,77,-61,146,-86,221xm305,-104v-3,36,-19,43,-48,73v21,0,53,-4,51,16v-3,27,-58,15,-87,15v-12,0,-20,-5,-20,-15v0,-23,59,-56,66,-88v1,-8,-7,-12,-13,-12v-21,-2,-12,35,-34,32v-10,-1,-16,-7,-17,-17v0,-24,25,-47,52,-47v25,0,52,18,50,43","w":324},"\u00be":{"d":"20,-209v4,-46,98,-45,96,5v-1,12,-4,24,-16,28v46,22,19,84,-30,84v-28,0,-55,-16,-55,-41v0,-8,9,-16,18,-16v17,0,16,26,35,24v10,-1,19,-6,18,-17v3,-20,-40,-10,-36,-30v-3,-19,32,-13,31,-29v-9,-25,-33,6,-45,7v-9,1,-17,-6,-16,-15xm137,-9v-7,20,-34,20,-35,-1v25,-76,58,-146,86,-220v2,-21,35,-20,35,0v-24,77,-61,146,-86,221xm276,2v-16,0,-19,-14,-18,-32v-25,-1,-70,8,-60,-23r45,-77v10,-25,50,-19,50,9v0,19,-4,45,2,60v11,0,18,6,18,15v0,10,-8,16,-20,16v1,18,-1,33,-17,32xm258,-61r0,-39r-21,39r21,0","w":324},"\u00d0":{"d":"120,0v-44,-1,-93,13,-93,-41r0,-58v-16,2,-27,-8,-27,-22v0,-14,11,-24,27,-22v3,-44,-15,-103,40,-97v102,-9,166,29,166,121v0,71,-40,121,-113,119xm134,-120v0,26,-26,20,-52,21r0,51v60,6,92,-18,92,-72v0,-53,-34,-77,-92,-72r0,49v26,0,52,-2,52,23","w":238},"\u00d7":{"d":"157,-83v15,11,9,31,-8,32v-21,-8,-36,-33,-53,-47v-17,14,-32,39,-53,47v-17,-1,-21,-18,-8,-32r37,-38v-14,-17,-38,-32,-46,-54v1,-17,19,-20,32,-7r38,37v17,-14,32,-38,53,-46v18,0,21,19,8,32r-37,38"},"\u00dd":{"d":"101,-264v-15,5,-26,-4,-26,-17v8,-27,50,-27,75,-38v19,-1,25,28,5,35xm145,-225v12,-27,53,-22,56,8v-14,39,-49,70,-71,104v-5,44,17,117,-28,117v-42,0,-23,-73,-27,-117v-22,-34,-55,-64,-69,-103v-2,-24,31,-37,47,-18v17,21,33,46,49,68","w":207},"\u00de":{"d":"194,-128v0,63,-48,90,-121,81v1,28,-2,51,-27,51v-17,0,-28,-14,-28,-37r0,-174v0,-24,8,-34,28,-37v16,2,28,13,27,35v73,-6,120,17,121,81xm138,-128v0,-31,-31,-36,-65,-33r0,66v34,3,64,-3,65,-33","w":198},"\u00f0":{"d":"96,-183r-22,-19v-14,9,-49,28,-50,-3v-1,-13,15,-15,23,-21v-15,-14,-4,-41,16,-40v9,0,20,6,32,18v15,-10,47,-26,50,4v1,11,-17,16,-25,21v34,32,63,75,63,129v0,56,-33,98,-88,98v-52,0,-89,-39,-89,-94v0,-53,37,-93,90,-93xm131,-91v0,-25,-13,-45,-37,-46v-21,-1,-35,21,-35,45v0,25,14,46,35,46v22,1,37,-22,37,-45","w":189},"\u00fd":{"d":"9,-140v-19,-29,12,-57,37,-39v19,25,29,66,43,97v14,-31,24,-71,42,-97v23,-18,53,6,39,40r-88,206v-22,25,-57,-1,-42,-35r21,-49xm87,-205v-19,7,-34,-15,-21,-29v20,-12,45,-22,70,-29v20,0,24,28,4,36","w":178},"\u00fe":{"d":"15,-229v-7,-41,53,-46,53,-9r0,73v44,-53,134,5,124,72v6,67,-69,126,-124,81v2,42,5,108,-44,80v-8,-4,-9,-18,-9,-29r0,-268xm139,-91v0,-23,-15,-46,-37,-46v-23,0,-35,21,-35,45v0,25,12,45,35,46v23,1,37,-22,37,-45","w":197}}});