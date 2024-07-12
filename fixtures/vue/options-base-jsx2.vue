<script lang="tsx">
  export default {
    name: 'TestComponent',
    props: {
      msg: {
        type: String,
        required: true,
      },
    },
    data: function() {
      return {
        number: 0,
      }
    },
    computed: {
      count:()=> {
        return counterStore.count
      }
    },
    methods: {
      plus:()=> {
        counterStore.increment();
        this.plus();
      },
      add() {
        counterStore.add(Number(this.number));
        this.add();
      }
    },
    provide() {
      return {
        count: this.count,
      }
    },
    render(){
      return (<div>
        <div>{this.count}</div>
        <button onClick={this.plus}></button>
      </div>)
    }
  }
</script>

<style scoped>
a {
  color: #42b983;
}

label {
  margin: 0 0.5em;
  font-weight: bold;
}

code {
  background-color: #eee;
  padding: 2px 4px;
  border-radius: 4px;
  color: #304455;
}
</style>