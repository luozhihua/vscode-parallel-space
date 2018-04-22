<template>
  <div class="dialog">
    <header>header</header>
    <main>
      <p>asd</p>
      <ul>
        <li>1</li>
        <li>2</li>
        <li>3</li>
        <li>4</li>
        <li>5</li>
        <li>6</li>
        <li>7</li>
        <li>8</li>
        <li>9</li>
        <li>10</li>
      </ul>
    </main>
    <footer>footer</footer>
  </div>
</template>

<script>
export default {
  data() {
    return {};
  },

  mounted() {
    console.log('mounted!');
  },
};
</script>

<style lang="less">
  .dialog {
    width: 500px;

    header {
      height: 40px;
      background: red;
    }
    main {
      padding: 10px;
      min-height: 400px;
      overflow: auto;
    }
    footer {
      height: 40px;
      background: green;
    }
  }
</style>
