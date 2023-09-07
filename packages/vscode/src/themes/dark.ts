const used_bg = '#9dc2f9';
const used_border = '#3d7de4';
const used_highlight_bg = '#9dc2f9';
const used_highlight_border = '#3d7de4';
const used_font_color = '#fff';

const normal_bg = '#ddd';
const normal_border = '#ccc';
const normal_highlight_bg = '#ddd';
const normal_highlight_border = '#ccc';
const normal_font_color = '#c8c9cc';


const options = {
  vis: {
    groups: {
      used: {
        color: {
          border: used_border,
          background: used_bg,
          highlight: {
            border: used_highlight_border,
            background: used_highlight_bg,
          },
        },
        font: {
          color: used_font_color,
        },
      },
      normal: {
        color: {
          border: normal_border,
          background: normal_bg,
          highlight: {
            border: normal_highlight_border,
            background: normal_highlight_bg,
          },
        },
        font: {
          color: normal_font_color,
        },
      },
    },
  },
  legend: {
    used: used_bg,
    normal: normal_bg,
    variant: '#fff',
    func: '#fff',
  },
};

export default options;