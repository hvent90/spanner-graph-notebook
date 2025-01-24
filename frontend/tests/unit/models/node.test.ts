const GraphNode = require('../../../src/models/node.js');

describe('Node', () => {
    let graphNode: typeof GraphNode;

    beforeEach(() => {
        graphNode = new GraphNode({
            label: 'Test Node',
            id: 1,
            value: 100,
            neighborhood: 2,
            color: '#ffffff',
            properties: {
                name: 'Test Node',
                type: 'example'
            },
            key_property_names: ['name']
        });
    });

    it('should create a valid node with required parameters', () => {
        expect(graphNode).toBeDefined();
        expect(graphNode.id).toBe(1);
        expect(graphNode.value).toBe(100);
        expect(graphNode.label).toBe('Test Node');
        expect(graphNode.instantiated).toBe(true);
    });

    it('should throw error when id is not a number', () => {
        const invalidNode = new GraphNode({
            label: 'Invalid Node',
            id: 'not-a-number'
        });
        
        expect(invalidNode.instantiationErrorReason).toBe("Node does not have an ID");
    });

    it('should parse identifiers from properties using key_property_names', () => {
        expect(graphNode.identifiers).toEqual(['Test Node']);
    });

});