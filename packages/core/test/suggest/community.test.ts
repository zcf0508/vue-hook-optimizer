import type { RelationType, TypedNode } from '@/analyze/utils';
import { NodeType } from '@/analyze/utils';
import { calculateSemanticSimilarity, detectCommunities, extractBaseWords, generateCommunityColors, generateCommunityColorsRGBA } from '@/suggest/community';

const TEST_SEED = 42;

describe('community detection', () => {
  it('should detect isolated nodes as separate communities', () => {
    const graph = new Map<TypedNode, Set<{ node: TypedNode, type: RelationType }>>();
    const node1: TypedNode = { label: 'node1', type: NodeType.var };
    const node2: TypedNode = { label: 'node2', type: NodeType.var };
    const node3: TypedNode = { label: 'node3', type: NodeType.var };

    graph.set(node1, new Set());
    graph.set(node2, new Set());
    graph.set(node3, new Set());

    const result = detectCommunities(graph, { seed: TEST_SEED });

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

    const result = detectCommunities(graph, { seed: TEST_SEED });

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

    const result = detectCommunities(graph, { seed: TEST_SEED });

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

    const result = detectCommunities(graph, { seed: TEST_SEED });

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
    const result = detectCommunities(graph, { seed: TEST_SEED });

    expect(result.communities.length).toBe(0);
    expect(result.nodeToCommuntiy.size).toBe(0);
  });

  it('should handle single node', () => {
    const graph = new Map<TypedNode, Set<{ node: TypedNode, type: RelationType }>>();
    const node: TypedNode = { label: 'single', type: NodeType.var };
    graph.set(node, new Set());

    const result = detectCommunities(graph, { seed: TEST_SEED });

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

    const result = detectCommunities(graph, { seed: TEST_SEED });

    expect(result.communities.length).toBe(2);
    expect(result.communities[0].nodes.size).toBe(3);
    expect(result.communities[1].nodes.size).toBe(1);
  });

  it('should produce deterministic results with same seed', () => {
    const graph = new Map<TypedNode, Set<{ node: TypedNode, type: RelationType }>>();

    const a: TypedNode = { label: 'a', type: NodeType.var };
    const b: TypedNode = { label: 'b', type: NodeType.var };
    const c: TypedNode = { label: 'c', type: NodeType.fun };

    graph.set(a, new Set([{ node: b, type: 'get' }]));
    graph.set(b, new Set([{ node: c, type: 'call' }]));
    graph.set(c, new Set());

    const result1 = detectCommunities(graph, { seed: 123 });
    const result2 = detectCommunities(graph, { seed: 123 });

    expect(result1.communities.length).toBe(result2.communities.length);
    for (const [node, communityId] of result1.nodeToCommuntiy) {
      expect(result2.nodeToCommuntiy.get(node)).toBe(communityId);
    }
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

describe('extractBaseWords', () => {
  it('should extract base words from camelCase identifiers', () => {
    expect(extractBaseWords('userName')).toEqual(['user']);
    expect(extractBaseWords('userProfileData')).toEqual(['user', 'profile']);
  });

  it('should remove common prefixes', () => {
    expect(extractBaseWords('handleClick')).toEqual(['click']);
    expect(extractBaseWords('onClick')).toEqual(['click']);
    expect(extractBaseWords('isVisible')).toEqual(['visible']);
    expect(extractBaseWords('hasPermission')).toEqual(['permission']);
    expect(extractBaseWords('getUser')).toEqual(['user']);
    expect(extractBaseWords('setUser')).toEqual(['user']);
  });

  it('should remove common suffixes', () => {
    expect(extractBaseWords('clickHandler')).toEqual(['click']);
    expect(extractBaseWords('userCallback')).toEqual(['user']);
  });

  it('should handle snake_case', () => {
    expect(extractBaseWords('user_name')).toEqual(['user']);
  });

  it('should return remaining tokens when all content words are stripped', () => {
    expect(extractBaseWords('handleChange')).toEqual(['change']);
    expect(extractBaseWords('onChange')).toEqual(['change']);
  });

  it('should handle identifiers with mixed prefix/suffix and content', () => {
    expect(extractBaseWords('handleOpenChange')).toEqual(['open']);
    expect(extractBaseWords('isModalOpen')).toEqual(['modal']);
    expect(extractBaseWords('fetchUserData')).toEqual(['user']);
  });
});

describe('calculateSemanticSimilarity', () => {
  it('should return 1 for identical labels', () => {
    expect(calculateSemanticSimilarity('open', 'open')).toBe(1);
  });

  it('should detect substring relationships', () => {
    const similarity = calculateSemanticSimilarity('open', 'isOpen');
    expect(similarity).toBeGreaterThan(0.5);
  });

  it('should detect shared base words', () => {
    const similarity = calculateSemanticSimilarity('isOpen', 'handleOpenChange');
    expect(similarity).toBeGreaterThan(0);
  });

  it('should return 0 for unrelated identifiers', () => {
    expect(calculateSemanticSimilarity('userName', 'fetchProducts')).toBe(0);
  });

  it('should handle handler/state pairs', () => {
    const similarity = calculateSemanticSimilarity('visible', 'handleVisibleChange');
    expect(similarity).toBeGreaterThan(0);
  });
});

describe('semantic community detection', () => {
  it('should not group isolated nodes even with semantic similarity', () => {
    const graph = new Map<TypedNode, Set<{ node: TypedNode, type: RelationType }>>();

    const open: TypedNode = { label: 'open', type: NodeType.var };
    const isOpen: TypedNode = { label: 'isOpen', type: NodeType.var };
    const toggleOpen: TypedNode = { label: 'toggleOpen', type: NodeType.fun };

    // No structural connections - all isolated nodes
    graph.set(open, new Set());
    graph.set(isOpen, new Set());
    graph.set(toggleOpen, new Set());

    const result = detectCommunities(graph, { seed: TEST_SEED, semanticWeight: 0.5 });

    // Isolated nodes should each be in their own community
    // Semantic similarity alone should not create connections
    expect(result.communities.length).toBe(3);
  });

  it('should enhance connected nodes with semantic similarity', () => {
    const graph = new Map<TypedNode, Set<{ node: TypedNode, type: RelationType }>>();

    const open: TypedNode = { label: 'open', type: NodeType.var };
    const isOpen: TypedNode = { label: 'isOpen', type: NodeType.var };
    const toggleOpen: TypedNode = { label: 'toggleOpen', type: NodeType.fun };

    // Create structural connections
    graph.set(open, new Set([{ node: isOpen, type: 'dep' as RelationType }]));
    graph.set(isOpen, new Set([{ node: toggleOpen, type: 'dep' as RelationType }]));
    graph.set(toggleOpen, new Set());

    const result = detectCommunities(graph, { seed: TEST_SEED, semanticWeight: 0.5 });

    // Connected nodes with semantic similarity should be grouped together
    const openCommunityId = result.nodeToCommuntiy.get(open);
    const isOpenCommunityId = result.nodeToCommuntiy.get(isOpen);
    const toggleOpenCommunityId = result.nodeToCommuntiy.get(toggleOpen);

    expect(openCommunityId).toBe(isOpenCommunityId);
    expect(openCommunityId).toBe(toggleOpenCommunityId);
    expect(result.communities.length).toBe(1);
  });

  it('should increase similarity when base words match', () => {
    const similarity1 = calculateSemanticSimilarity('open', 'isOpen');
    const similarity2 = calculateSemanticSimilarity('open', 'userName');

    expect(similarity1).toBeGreaterThan(similarity2);
  });

  it('should respect semanticWeight=0 to disable semantic grouping', () => {
    const graph = new Map<TypedNode, Set<{ node: TypedNode, type: RelationType }>>();

    const isOpen: TypedNode = { label: 'isOpen', type: NodeType.var };
    const handleOpenChange: TypedNode = { label: 'handleOpenChange', type: NodeType.fun };

    graph.set(isOpen, new Set());
    graph.set(handleOpenChange, new Set());

    const result = detectCommunities(graph, { seed: TEST_SEED, semanticWeight: 0 });

    expect(result.communities.length).toBe(2);
  });
});
