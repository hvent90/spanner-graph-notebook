const GraphObject = require('../../../src/models/graph-object.js');

describe('Graph Object', () => {
    it('Should create a Graph Object instance', () => {
       const graphObject = new GraphObject({
           label: 'foo', properties: []
       });

       expect(graphObject).toBeInstanceOf(GraphObject);
    });
});