<?php
if ( !class_exists('FileCache') ) :
	class FileCache {
		private $cache_dir;
		private $cache_time;
		private $cache_file;

		/**
		 * 构造函数
		 *
		 * @param string $cache_dir 缓存目录
		 * @param int $cache_time 缓存时间
		 */
		public function __construct($cache_dir, $cache_time = 3600) {
			$this->cache_dir  = $cache_dir;
			$this->cache_time = $cache_time;
		}

		/**
		 * 获取缓存
		 *
		 * @param string $key 缓存键
		 * @param bool $decode 是否解码
		 */
		public function get($key, $decode = true) {
			$this->cache_file = $this->cache_dir.'/'.$key.'.json';
			if ( $this->has($key) ) {
				$content = file_get_contents($this->cache_file);

				return $decode ? json_decode($content) : $content;
			}

			return false;
		}

		/**
		 * 设置缓存
		 *
		 * @param string $key 缓存键
		 * @param mixed $value 缓存值
		 */
		public function set($key, $value) {
			$this->cache_file = $this->cache_dir.'/'.$key.'.json';
			file_put_contents($this->cache_file, json_encode($value));
		}

		/**
		 * 删除缓存
		 *
		 * @param string $key 缓存键
		 */
		public function delete($key) {
			$this->cache_file = $this->cache_dir.'/'.$key.'.json';
			if ( file_exists($this->cache_file) ) {
				unlink($this->cache_file);
			}
		}

		/**
		 * 判断缓存是否存在和是否过期
		 *
		 * @param string $key 缓存键
		 */
		public function has($key) {
			$this->cache_file = $this->cache_dir.'/'.$key.'.json';

			if ( file_exists($this->cache_file) ) {
				return time()-filemtime($this->cache_file) < $this->cache_time;
			}

			return false;
		}

		/**
		 * 读取文件缓存时间
		 *
		 * @param string $key 缓存键
		 */
		public function get_file_time($key) {
			$this->cache_file = $this->cache_dir.'/'.$key.'.json';
			if ( $this->has($key) ) {
				return filemtime($this->cache_file);
			}

			return false;
		}
	}
endif;
