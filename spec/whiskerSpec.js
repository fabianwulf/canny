canny.add('whiskerSample', (function () {
    var data2 = function () {
            return {
                name : 'whisker'
            };
        },
        data3 = {
            user : {
                name: 'Peter',
                age: 30
            }
        },
        concatStringAttributesFc;

    return {
        changeScopeBindUpdate : (function () {
            var wCb;
            return {
                update : function (obj) {wCb(obj)},
                whiskerAPI : function (whiskerCb) {
                    wCb = whiskerCb;
                    wCb({
                        text : 'text1'
                    })
                }
            }
        }()),
        changeConcatStringAttributes : function (obj) {
            concatStringAttributesFc('scope',obj);
        },
        concatStringAttributes : function (fc) {
            concatStringAttributesFc = fc;
            fc('scope', {
                before: "before",
                middle: "middle",
                end: "end"
            })
        },
        attributes : function (fc) {
            fc({
                id : 'idFoo',
                testClass : 'classFoo'
            })
        },
        attributes2 : function (fc) {
            fc('scope2', {
                testClass : 'bar'
            })
        },
        custom : (function () {
            var whiskerCb;
            return {
                changeTo : function (scope, obj) {
                    whiskerCb(scope, obj);
                },
                whisker : function (fc) {
                    whiskerCb = fc;
                }
            }
        }()),
        supportScopes : function (fc) {
            fc('scope1', {
                id : 'foo1',
                testClass : 'classTest1',
                text : 'foo1'
            });
            fc('scope2', {
                id : 'foo2',
                testClass : 'classTest2',
                text : 'foo2'
            });
            fc('scope3', {
                id : 'foo3',
                testClass : 'classTest3',
                text : 'foo3'
            });
        },
        /**
         * save it in scope BUT: if other scope is out of this scope but has the same name it should not be effected by changing this... so
         * save also the node and parse from there.
         *
         * @returns {{changeData: changeData, whiskerAPI: whiskerAPI}}
         */
        dynamicallyChangeData : (function () {
            var updateWhisker;
            return {
                // call this to change the data and update the DOM
                changeData : function (obj) {
                    updateWhisker('scope', obj);
                },
                // pass this as reference to whisker
                whiskerAPI : function (fc) {
                    updateWhisker = fc;
                    updateWhisker('scope', {
                        className : 'init',
                        text : 'initial text',
                        id : 'main'
                    });
                }
            }
        }()),
        sameScopeShouldNotEffected : function (fc) {
            fc('scope', {
                className : 'foo',
                text : 'bar',
                id : 'hoo'
            });
        },
        data3 : data3,
        data4 : function (fc) {
            fc('scope2', {
                name : 'birdy',
                age : 0
            })
        },
        add : function (node, attr) {}
    };
}()));

describe('Check whisker', function() {

    var mainNode;

    beforeAll(function () {
        mainNode = canny.fixture.load('whiskerSpec.html');
    });

    it('should have whisker', function () {
        expect(canny.whisker).toBeDefined();
    });

    describe('loadFromObject', function () {
        var node;

        beforeAll(function () {
            node = mainNode.querySelector('#loadFromObject');
        });

        it('should add the normal text to each strong', function () {
            var data = node.children[0].children;
            expect(data[0].innerHTML).toEqual("Peter");
            expect(data[1].innerHTML).toEqual("30");
        });

        it('should not remove the other expression', function () {
            var data = node.children[1];
            expect(data.innerHTML).toEqual("And this expression should stay: {{scopeX.foo}}.");
        });

        it('should have replaced the inner expression from a other scope correctly', function () {
            var data = node.children[2].children[0];
            expect(data.innerHTML).toEqual("Hello I'm birdy and I'm 0 years old.");
        });
    });

    describe('loadFromStaticObject', function () {
        var node;

        beforeAll(function () {
            node = mainNode.querySelector('#loadFromStaticObject');
        });

        it('should add the text correct', function () {
            var data = node.children[0];
            expect(data.innerHTML).toEqual("DATA: my text");
        });
    });

    describe('test scope bind update without telling scope again in update function', function () {
        var nodeChild;

        beforeAll(function () {
            nodeChild = mainNode.querySelector('#testScopeBindUpdate').children[0];
        });

        it('should contain the initial text', function () {
            expect(nodeChild.innerHTML).toEqual("DATA: text1");
        });

        it('should have updated the text', function () {
            canny.whiskerSample.changeScopeBindUpdate.update({
                text : 'text2'
            });
            expect(nodeChild.innerHTML).toEqual("DATA: text2");
        });
    });

    describe('test that dynamically update data works fine so', function () {
        var nodeDynamic, nodeNotEffected;

        beforeAll(function () {
            nodeDynamic = mainNode.querySelector('#dynamicallyChangeData');
            nodeNotEffected = mainNode.querySelector('#sameScopeShouldNotEffected');
        });
        /**
         * the DOM structure for this test is always the same so add the object what you want test and the node
         *
         * @param node
         * @param obj
         */
        function checkDOM(node, obj) {
            var data = node.children;
            expect(data[0].getAttribute('id')).toEqual(obj.id);
            expect(data[0].children[0].className).toEqual(obj.className1);
            expect(data[1].className).toEqual(obj.className2);
            expect(data[1].innerHTML).toEqual(obj.text1);
            expect(data[2].innerHTML).toEqual(obj.text2);
        }

        it('should have the correct initial data', function () {
            checkDOM(nodeDynamic, {
                id : 'main',
                className1 : 'test with init',
                className2 : 'init',
                text1 : 'initial text',
                text2 : 'texts replace initial text inside a text'
            })
        });

        it('should have data with the same scope name but in a different container set correctly', function () {
            checkDOM(nodeNotEffected, {
                id : 'hoo',
                className1 : 'test with foo',
                className2 : 'foo',
                text1 : 'bar',
                text2 : 'texts replace bar inside a text'
            })
        });

        it('should update the text correct from scope', function () {
            canny.whiskerSample.dynamicallyChangeData.changeData({
                id : 'newIdTest',
                className : 'newClass2',
                text : 'a different text'
            });
            checkDOM(nodeDynamic, {
                id : 'newIdTest',
                className1 : 'test with newClass2',
                className2 : 'newClass2',
                text1 : 'a different text',
                text2 : 'texts replace a different text inside a text'
            });
        });

        it('should not effect the other scope with same name', function () {
            checkDOM(nodeNotEffected, {
                id : 'hoo',
                className1 : 'test with foo',
                className2 : 'foo',
                text1 : 'bar',
                text2 : 'texts replace bar inside a text'
            })
        });

        it('should update the attributes correct from scope after added attribute with white spaces', function () {
            canny.whiskerSample.dynamicallyChangeData.changeData({
                id : 'thirdId',
                className : 'more classes added',  // TODO that will work but the next update doesn't
                text1 : 'a different text',
                text2 : 'texts replace a different text inside a text'
            });
            checkDOM(nodeDynamic, {
                id : 'thirdId',
                className1 : 'test with more classes added',
                className2 : 'more classes added',
                text1 : 'a different text',
                text2 : 'texts replace a different text inside a text'
            });

            canny.whiskerSample.dynamicallyChangeData.changeData({
                className : 'testclass'  // TODO that will work but the next update doesn't
            });
            checkDOM(nodeDynamic, {
                id : 'thirdId',
                className1 : 'test with testclass',
                className2 : 'testclass',
                text1 : 'a different text',
                text2 : 'texts replace a different text inside a text'
            });
        });

        describe('test update with empty string and spaces', function () {
            // stress test ;)

            // it('should update the view if empty string is passed', function () {
            //     canny.whiskerSample.dynamicallyChangeData.changeData({
            //         id : 'id',
            //         className : 'test',
            //         text : ''
            //     });
            //     checkDOM(nodeDynamic, {
            //         id : 'id',
            //         className1 : 'test with test',
            //         className2 : 'test',
            //         text1 : '',
            //         text2 : 'texts replace  inside a text' // remove double space it's wrong
            //     })
            //
            // });
            //
            // it('should update the view if empty string is passed', function () {
            //     canny.whiskerSample.dynamicallyChangeData.changeData({
            //         id : 'id',
            //         className : 'with',
            //         text : ''
            //     });
            //     checkDOM(nodeDynamic, {
            //         id : 'id',
            //         className1 : 'test with with',
            //         className2 : 'with',
            //         text1 : '',
            //         text2 : 'texts replace  inside a text' // remove double space it's wrong
            //     })
            //
            // });

            // it('should update the view if empty string is passed', function () {
            //     canny.whiskerSample.dynamicallyChangeData.changeData({
            //         id : 'id',
            //         className : '',
            //         text : ''
            //     });
            //     checkDOM(nodeDynamic, {
            //         id : 'id',
            //         className1 : 'test with ',
            //         className2 : '',
            //         text1 : '',
            //         text2 : 'texts replace  inside a text' // remove double space it's wrong
            //     })
            //
            // });
            //
            // it('should update the view with spaces', function () {
            //     canny.whiskerSample.dynamicallyChangeData.changeData({
            //         id : 'id',
            //         className : ' ',
            //         text : ' '
            //     });
            //     checkDOM(nodeDynamic, {
            //         id : 'id',
            //         className1 : 'test with  ',
            //         className2 : ' ',
            //         text1 : ' ',
            //         text2 : 'texts replace   inside a text' // remove double space it's wrong
            //     })
            // });
            //
            // it('should update the view again with if empty strings', function () {
            //     canny.whiskerSample.dynamicallyChangeData.changeData({
            //         id : 'id',
            //         className : '',
            //         text : ''
            //     });
            //     checkDOM(nodeDynamic, {
            //         id : 'id',
            //         className1 : 'test with ',
            //         className2 : '',
            //         text1 : '',
            //         text2 : 'texts replace  inside a text' // remove double space it's wrong
            //     });
            // });

            // it('should update the view with some values', function () {
            //     canny.whiskerSample.dynamicallyChangeData.changeData({
            //         id : 'id',
            //         className : 'fooClass',
            //         text : 'fooClass'
            //     });
            //     checkDOM(nodeDynamic, {
            //         id : 'id',
            //         className1 : 'test with fooClass',
            //         className2 : 'fooClass',
            //         text1 : 'fooClass',
            //         text2 : 'texts replace fooClass inside a text' // remove double space it's wrong
            //     })
            // });

            // it('should update the view with empty string correctly', function () {
            //
            //     canny.whiskerSample.dynamicallyChangeData.changeData({
            //         id : 'id',
            //         className : '',
            //         text : ''
            //     });
            //
            //     checkDOM(nodeDynamic, {
            //         id : 'id',
            //         className1 : 'test with ',
            //         className2 : '',
            //         text1 : '',
            //         text2 : 'texts replace  inside a text' // remove double space it's wrong
            //     })
            //
            // });
        });

    });

    it('should load the data from a undefined property and leave the text empty', function () {
        var data = mainNode.querySelector('#checkIfPropertyIsUndefined').children;
        canny.whiskerSample.custom.changeTo('scope', {
            message : 'text'
        })
        expect(data[0].innerHTML).toEqual('');
        expect(data[1].innerHTML).toEqual('text');
    });

    it('should replace the data text for a undefined property', function () {
        var data = mainNode.querySelector('#checkIfPropertyIsUndefined').children;
        canny.whiskerSample.custom.changeTo('scope', {
            message : 'text',
            messageUndefined : 'text'
        })
        expect(data[0].innerHTML).toEqual('text');
        expect(data[1].innerHTML).toEqual('text');
    });

    it('should load the data from a undefined property and leave the attribute empty', function () {
        var data = mainNode.querySelector('#checkIfPropertyIsUndefined').children;
        canny.whiskerSample.custom.changeTo('scope', {
            attr : 'cssClass'
        })
        // TODO
        expect(data[0].getAttribute('class')).toEqual('');
        expect(data[1].getAttribute('class')).toEqual('cssClass');
    });

    it('should replace the data attribute for a undefined property', function () {
        var data = mainNode.querySelector('#checkIfPropertyIsUndefined').children;
        canny.whiskerSample.custom.changeTo('scope', {
            attr : 'cssClass',
            attrUndefined : 'cssClass'
        })
        expect(data[0].className).toEqual('cssClass');
        // TODO
//        expect(data[0].className).toEqual('other cssClass test');
        expect(data[1].className).toEqual('cssClass');
    });

    it('should load the data if the scope is defined in HTML', function () {
        var data = mainNode.querySelector('#checkAttributes').children;
        expect(data[0].getAttribute('id')).toEqual("idFoo");
        expect(data[0].className).toEqual("classFoo");
        expect(data[1].children[0].className).toEqual("test bar");
    });

    it('should support multiple scopes called from same function 3 times with different data', function () {
        var data = mainNode.querySelector('#supportMultipleScopes').children;
        expect(data[0].getAttribute('id')).toEqual("foo1");
        expect(data[0].className).toEqual("classTest1");
        expect(data[0].innerHTML).toEqual("foo foo1");

        expect(data[1].getAttribute('id')).toEqual("foo2");
        expect(data[1].className).toEqual("classTest2");
        expect(data[1].innerHTML).toEqual("foo foo2");

        expect(data[2].getAttribute('id')).toEqual("foo3");
        expect(data[2].className).toEqual("classTest3");
        expect(data[2].innerHTML).toEqual("foo foo3");
    });

    it('should concat attribute correctly if there are no spaces between the expressions', function () {
        var data = mainNode.querySelector('#concatStringAttributes').children[0];
        expect(data.className).toEqual("beforeandmiddleandend test");
    });

    it('should concat inner text correctly if there are no spaces between the expressions', function () {
        var data = mainNode.querySelector('#concatStringAttributes').children[1];
        expect(data.innerHTML).toEqual("The text beforeandmiddleandend test.");

    });

    describe('that after update the HTML view', function () {

        beforeAll(function () {
            canny.whiskerSample.changeConcatStringAttributes({
                before: "pre",
                middle: "center",
                end: "post"
            });
        });

        it('should concat attribute correctly if there are no spaces between the expressions', function () {
            var data = mainNode.querySelector('#concatStringAttributes').children[0];
            expect(data.className).toEqual("preandcenterandpost test");
        });

        it('should concat inner text correctly if there are no spaces between the expressions', function () {
            var data = mainNode.querySelector('#concatStringAttributes').children[1];
            expect(data.innerHTML).toEqual("The text preandcenterandpost test.");
        });
    });

    describe('that it not failes after multiple updates with spaces in the string', function () {

        it('should render with spaces', function () {
            var data = mainNode.querySelector('#concatStringAttributes').children;
            canny.whiskerSample.changeConcatStringAttributes({
                before: "pre pre",
                middle: "center",
                end: "post"
            });
            expect(data[0].className).toEqual("pre preandcenterandpost test");
            expect(data[1].innerHTML).toEqual("The text pre preandcenterandpost test.");
        });

        it('should re render with spaces', function () {
            var data = mainNode.querySelector('#concatStringAttributes').children;
            canny.whiskerSample.changeConcatStringAttributes({
                before: "x",
                middle: "center",
                end: "post"
            });
            expect(data[0].className).toEqual("xandcenterandpost test");
            expect(data[1].innerHTML).toEqual("The text xandcenterandpost test.");
        });

        it('should re render with spaces', function () {
            var data = mainNode.querySelector('#concatStringAttributes').children;
            canny.whiskerSample.changeConcatStringAttributes({
                before: "x x x",
                middle: "center",
                end: "post"
            });
            expect(data[0].className).toEqual("x x xandcenterandpost test");
            expect(data[1].innerHTML).toEqual("The text x x xandcenterandpost test.");
        });

        it('should re render with spaces', function () {
            var data = mainNode.querySelector('#concatStringAttributes').children;
            canny.whiskerSample.changeConcatStringAttributes({
                before: "different x",
                middle: "center",
                end: "post"
            });
            expect(data[0].className).toEqual("different xandcenterandpost test");
            expect(data[1].innerHTML).toEqual("The text different xandcenterandpost test.");
        });

        it('should re render with spaces', function () {
            var data = mainNode.querySelector('#concatStringAttributes').children;
            canny.whiskerSample.changeConcatStringAttributes({
                before: "before",
                middle: "center",
                end: "post"
            });
            expect(data[0].className).toEqual("beforeandcenterandpost test");
            expect(data[1].innerHTML).toEqual("The text beforeandcenterandpost test.");
        });
    });

});