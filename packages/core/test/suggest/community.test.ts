import type { RelationType, TypedNode } from '@/analyze/utils';
import { NodeType } from '@/analyze/utils';
import { detectCommunities, generateCommunityColors, generateCommunityColorsRGBA } from '@/suggest/community';

describe('community detection', () => {
  it('should detect isolated nodes as separate communities', () => {
    const graph = new Map<TypedNode, Set<{ node: TypedNode, type: RelationType }>>();
    const node1: TypedNode = { label: 'node1', type: NodeType.var };
    const node2: TypedNode = { label: 'node2', type: NodeType.var };
    const node3: TypedNode = { label: 'node3', type: NodeType.var };

    graph.set(node1, new Set());
    graph.set(node2, new Set());
    graph.set(node3, new Set());

    const result = detectCommunities(graph);

    expect(result.communities.length).toBe(3);
    expect(result.nodeToCommuntiy.size).toBe(3);
  });

  it('should detect connected nodes as single community', () => {
    const graph = new Map<TypedNode, Set<{ node: TypedNode, type: RelationType }>>();
    const node1: TypedNode = { label: 'node1', type: NodeType.var };
    const node2: TypedNode = { label: 'node2', type: NodeType.fun };
    const node3: TypedNode = { label: 'node3', type: NodeType.fun };

    graph.set(node1, new Set([{ node: node2, type: 'get' }]));
    graph.set(node2, new Set([{ node: node3, type: 'call' }]));
    graph.set(node3, new Set([{ node: node1, type: 'set' }]));

    const result = detectCommunities(graph);

    expect(result.communities.length).toBe(1);
    expect(result.communities[0].nodes.size).toBe(3);
  });

  it('should detect two separate groups', () => {
    const graph = new Map<TypedNode, Set<{ node: TypedNode, type: RelationType }>>();
    const nodeA1: TypedNode = { label: 'a1', type: NodeType.var };
    const nodeA2: TypedNode = { label: 'a2', type: NodeType.fun };
    const nodeB1: TypedNode = { label: 'b1', type: NodeType.var };
    const nodeB2: TypedNode = { label: 'b2', type: NodeType.fun };

    graph.set(nodeA1, new Set([{ node: nodeA2, type: 'get' }]));
    graph.set(nodeA2, new Set([{ node: nodeA1, type: 'set' }]));
    graph.set(nodeB1, new Set([{ node: nodeB2, type: 'get' }]));
    graph.set(nodeB2, new Set([{ node: nodeB1, type: 'set' }]));

    const result = detectCommunities(graph);

    expect(result.communities.length).toBe(2);
    expect(result.communities[0].nodes.size).toBe(2);
    expect(result.communities[1].nodes.size).toBe(2);
  });

  it('should detect communities in a more complex graph', () => {
    const graph = new Map<TypedNode, Set<{ node: TypedNode, type: RelationType }>>();

    const count: TypedNode = { label: 'count', type: NodeType.var };
    const doubleCount: TypedNode = { label: 'doubleCount', type: NodeType.var };
    const increment: TypedNode = { label: 'increment', type: NodeType.fun };

    const name: TypedNode = { label: 'name', type: NodeType.var };
    const fullName: TypedNode = { label: 'fullName', type: NodeType.var };
    const updateName: TypedNode = { label: 'updateName', type: NodeType.fun };

    graph.set(count, new Set());
    graph.set(doubleCount, new Set([{ node: count, type: 'get' }]));
    graph.set(increment, new Set([{ node: count, type: 'set' }]));

    graph.set(name, new Set());
    graph.set(fullName, new Set([{ node: name, type: 'get' }]));
    graph.set(updateName, new Set([{ node: name, type: 'set' }]));

    const result = detectCommunities(graph);

    expect(result.communities.length).toBe(2);

    const countCommunityId = result.nodeToCommuntiy.get(count);
    const nameCommunityId = result.nodeToCommuntiy.get(name);

    expect(countCommunityId).not.toBe(nameCommunityId);

    expect(result.nodeToCommuntiy.get(doubleCount)).toBe(countCommunityId);
    expect(result.nodeToCommuntiy.get(increment)).toBe(countCommunityId);

    expect(result.nodeToCommuntiy.get(fullName)).toBe(nameCommunityId);
    expect(result.nodeToCommuntiy.get(updateName)).toBe(nameCommunityId);
  });

  it('should handle empty graph', () => {
    const graph = new Map<TypedNode, Set<{ node: TypedNode, type: RelationType }>>();
    const result = detectCommunities(graph);

    expect(result.communities.length).toBe(0);
    expect(result.nodeToCommuntiy.size).toBe(0);
  });

  it('should handle single node', () => {
    const graph = new Map<TypedNode, Set<{ node: TypedNode, type: RelationType }>>();
    const node: TypedNode = { label: 'single', type: NodeType.var };
    graph.set(node, new Set());

    const result = detectCommunities(graph);

    expect(result.communities.length).toBe(1);
    expect(result.communities[0].nodes.has(node)).toBe(true);
  });

  it('should sort communities by size (largest first)', () => {
    const graph = new Map<TypedNode, Set<{ node: TypedNode, type: RelationType }>>();

    const small: TypedNode = { label: 'small', type: NodeType.var };

    const big1: TypedNode = { label: 'big1', type: NodeType.var };
    const big2: TypedNode = { label: 'big2', type: NodeType.fun };
    const big3: TypedNode = { label: 'big3', type: NodeType.fun };

    graph.set(small, new Set());
    graph.set(big1, new Set([{ node: big2, type: 'get' }]));
    graph.set(big2, new Set([{ node: big3, type: 'call' }]));
    graph.set(big3, new Set([{ node: big1, type: 'set' }]));

    const result = detectCommunities(graph);

    expect(result.communities.length).toBe(2);
    expect(result.communities[0].nodes.size).toBe(3);
    expect(result.communities[1].nodes.size).toBe(1);
  });
});

describe('generateCommunityColors', () => {
  it('should generate correct number of colors', () => {
    const colors = generateCommunityColors(5);
    expect(colors.length).toBe(5);
  });

  it('should generate valid HSL strings', () => {
    const colors = generateCommunityColors(3);
    colors.forEach((color) => {
      expect(color).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
    });
  });

  it('should generate distinct colors', () => {
    const colors = generateCommunityColors(10);
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(10);
  });
});

describe('generateCommunityColorsRGBA', () => {
  it('should generate correct number of color objects', () => {
    const colors = generateCommunityColorsRGBA(5);
    expect(colors.length).toBe(5);
  });

  it('should generate valid RGBA strings', () => {
    const colors = generateCommunityColorsRGBA(3);
    colors.forEach((color) => {
      expect(color.background).toMatch(/^rgba\(\d+, \d+, \d+, [\d.]+\)$/);
      expect(color.foreground).toMatch(/^rgba\(\d+, \d+, \d+, [\d.]+\)$/);
      expect(color.border).toMatch(/^rgba\(\d+, \d+, \d+, [\d.]+\)$/);
    });
  });

  it('should have lower opacity for background', () => {
    const colors = generateCommunityColorsRGBA(1);
    expect(colors[0].background).toContain('0.15');
    expect(colors[0].foreground).toContain('0.9');
    expect(colors[0].border).toContain('0.5');
  });
});
