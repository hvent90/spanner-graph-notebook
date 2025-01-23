const GraphObject = require('../models/graph-object');

describe('Graph Object', () => {
    it('Should create a Graph Object instance', () => {
       const graphObject = new GraphObject({
           label: 'foo', properties: []
       });

       expect(graphObject).toBeInstanceOf(GraphObject);
    });
})