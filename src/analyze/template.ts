import { v4 as uuid } from 'uuid';
import { compileTemplate } from '@vue/compiler-sfc';
import { ts } from '@ast-grep/napi';
import { getRules } from '../utils/ast-grep-rules';

export function analyze(
  content: string
) {
  const id = uuid();
  const { code } = compileTemplate({
    id: id,
    source: content,
    filename: `${id}.js`,
  });

  // console.log(code);
  const sgNode = ts.parse(code).root();

  // ----

  const nodes = new Set<string>();
  
  sgNode.findAll(getRules('CTX_MEMBER_EXPRESSION')).forEach((n) => {
    nodes.add(n.text().split('_ctx.')[1]);
  });

  sgNode.findAll(getRules('REF_DOM')).forEach(n => {
    nodes.add(n.text().split('"')[1]);
  });

  sgNode.findAll(getRules('RESOLVE_COMPONENT')).forEach(n => {
    nodes.add(n.text().split('"')[1]);
  });

  return nodes;
}
