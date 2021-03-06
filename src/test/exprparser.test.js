/**
 * Copyright (c) 2013 Azeem Arshad
 * See the file license.txt for copying permission.
 */

test('ExprParser GLSL Generation', function() {
    var codeGen = new Webvs.ExprCodeGenerator({
        init: "c=200;f=0;dt=0;dl=0;beatdiv=8",
        perFrame: [
            "f = f + 1;",
            "t = ((f * $PI * 2)/c)/beatdiv;",
            "dt = dl + t;",
            "dx = 14+(cos(dt)*8);",
            "dy = 10+(sin(dt*2)*4);"
        ].join("\n"),
        onBeat: "c=f;f=0;dl=dt",
        perPixel: "x=x+(sin(y*dx)*.03); y=rand(y)-(cos(x*dy)*.03);"
    }, ["x", "y", "r", "d", "b", "w", "h"]);

    var glslExpect = "float x;float y;float r;float d;uniform float b;uniform float w;uniform float h;uniform float c;uniform float f;uniform float dt;uniform float dl;uniform float beatdiv;uniform float dx;uniform float dy;uniform vec2 __randStep;\nvec2 __randSeed;\nfloat rand(float max) {\n   __randCur += __randStep;\n   float val = fract(sin(dot(__randSeed.xy ,vec2(12.9898,78.233))) * 43758.5453);\n   return (floor(val*max)+1);\n}void perPixel() {x=(x+((sin((y*dx)))*0.03));\ny=((rand(y))-((cos((x*dy)))*0.03));}";

    var list = codeGen.generateCode(["init", "perFrame", "onBeat"], ["perPixel"], ["x", "y", "d", "r"]);
    var js = list[0];
    var glsl = list[1];

    equal(glslExpect, glsl, "Glsl code can be generated");
});

test("ExprParser comments", function() {
    var codeGen = new Webvs.ExprCodeGenerator({
        test: [
            "a = a + 1;// this is a single line comment",
            "a = pow( /*this is a comment in between*/ a, 2);",
            "b = a + 1; /* this comment spans mutliple",
            "lines */ c = b"
        ].join("\n")
    }, ["a", "c"]);
    var list = codeGen.generateCode(["test"], [], []);
    var js = list[0];

    js.a = 1;
    js.test();
    equal(js.c, 5, "comments are supported");
});

test("ExprParser register support", function() {
    var codeGen1 = new Webvs.ExprCodeGenerator({
        test: "@hello = a;reg12 = a;"
    }, ["a"]);

    var codeGen2 = new Webvs.ExprCodeGenerator({
        test: "b = @hello + 1;c = reg12 + 2"
    }, ["b", "c"]);

    var js1 = codeGen1.generateCode(["test"], [], [])[0];
    var js2 = codeGen2.generateCode(["test"], [], [])[0];

    var bank = {};
    js1.initRegisterBank(bank);
    js2.initRegisterBank(bank);

    js1.a = 10;
    js1.test();
    js2.test();
    equal(js2.b, 11, "register variables with @ syntax works");
    equal(js2.c, 12, "register variables with regXX syntax works");
});

test("ExprParser comparison function test", function() {
    var codeGen = new Webvs.ExprCodeGenerator({
        test: "d = if(above(a, b), if(above(a, c), a ,  c), if(above(b, c), b, c));\n" +
              "e = if(below(a, b), if(below(a, c), a ,  c), if(below(b, c), b, c));"
    }, ["a", "b", "c", "d", "e"]);

    var js = codeGen.generateCode(["test"], [], [])[0];
    js.a = 12;
    js.b = 9.23;
    js.c = 12.54;
    js.test();
    equal(js.d, 12.54, "if and above works");
    equal(js.e, 9.23, "if and below works");
});