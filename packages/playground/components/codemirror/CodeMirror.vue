<script setup lang="ts">
import type { ModeSpec, ModeSpecOptions } from 'codemirror';
import { debounce } from 'lodash-es';
import { inject, onMounted, ref, watchEffect } from 'vue';
import CodeMirror from './codemirror';

export interface Props {
  mode?: string | ModeSpec<ModeSpecOptions>
  value?: string
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'htmlmixed',
  value: '',
  readonly: false,
});

const emit = defineEmits<(e: 'change', value: string) => void>();

const el = ref();
const needAutoResize = inject('autoresize');

onMounted(() => {
  const addonOptions = props.readonly
    ? {}
    : {
      autoCloseBrackets: true,
      autoCloseTags: true,
      foldGutter: true,
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
      keyMap: 'sublime',
    };

  const editor = CodeMirror(el.value!, {
    value: '',
    mode: props.mode,
    readOnly: props.readonly,
    tabSize: 2,
    lineWrapping: true,
    lineNumbers: true,
    ...addonOptions,
  });

  editor.on('change', () => {
    emit('change', editor.getValue());
  });

  watchEffect(() => {
    const cur = editor.getValue();
    if (props.value !== cur) {
      editor.setValue(props.value);
    }
  });

  watchEffect(() => {
    editor.setOption('mode', props.mode);
  });

  setTimeout(() => {
    editor.refresh();
  }, 50);

  if (needAutoResize) {
    window.addEventListener(
      'resize',
      debounce(() => {
        editor.refresh();
      }, 100),
    );
  }
});
</script>

<template>
  <div ref="el" class="editor" />
</template>

<style>
.editor {
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.CodeMirror {
  font-family: var(--font-code);
  line-height: 1.5;
  height: 100%;
}
</style>
