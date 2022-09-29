<?php
/*
Template Name: 友情链接
*/
get_header();
?>
    <section class="article">
        <?php
        if ( have_posts() ) :
            while ( have_posts() ) : the_post();
                require_once( "inc/article-header.php" ); ?>
                <article class="article-content" itemscope itemtype="https://schema.org/Article">
                    <ul id="<?= ( is_super_admin() ? 'Links' : '' ) ?>"
                        class="article-cards article-links columns reset-ul">
                        <?php the_friendly_links(); ?>
                    </ul>
                    <?php the_content(); ?>
                </article>
            <?php
            endwhile;
        endif;
        ?>
    </section>
    <!--判断是否登录-->
<?php if ( is_super_admin() ): ?>
    <script>
        // 友情链接设置
        window.LinkSettingDialog = () => {
            const Dialog = Vue.extend({
                template: `
                <div class="modal active modal-links">
                    <a href="javascript: void(0);" class="modal-overlay" @click="hide" aria-label="Close"></a>
                    <div class="modal-container uni-shadow" style="max-width: 980px;">
                        <div class="modal-header">
                            <a href="javascript: void(0);" class="btn btn-clear text-gray float-right" @click="hide" aria-label="Close"></a>
                            <div class="modal-title h5 text-gray">友情链接设置</div>
                        </div>
                        <form method="post" action @submit="e => e.preventDefault()">
                            <div class="modal-body article wp-block-table is-style-stripes" ref="body">
                                <div v-if="loading" class="loading" style="position: absolute;inset: 0;z-index: 1;"></div>
                                <table class="table table-scroll" :style="{ opacity: loading ? 0.3 : 1 }">
                                    <thead>
                                        <tr><th v-for="col of tableColumn" :key="col.prop" v-bind="col.bind">{{ col.name }}</th></tr>
                                    </thead>
                                    <tbody ref="DragSort">
                                        <tr v-for="(rows, index) of links" :key="index" :class="['text-tiny', { drag: !rows.edit }]">
                                            <td v-for="{ name, prop, slot } of tableColumn" :key="prop">
                                                <template v-if="!slot">
                                                    <span v-if="!rows.edit">{{ rows[prop] || "" }}</span>
                                                    <input v-else class="form-input" v-model="rows[prop]" :placeholder="name" />
                                                </template>
                                                <template v-else>
                                                    <template v-if="prop === 'operate'">
                                                        <button class="btn btn-link btn-sm" @click="handleEditLink(index)">{{ rows.edit ? '确定' : '编辑' }}</button>
                                                        <button class="btn btn-link btn-sm text-error" @click="handleRemoveLink(index)">删除</button>
                                                    </template>
                                                    <template v-else-if="prop === 'drag-handle'">
                                                        <div v-show="!rows.edit" class="drag-handle dashicons dashicons-menu c-move"></div>
                                                    </template>
                                                </template>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div class="modal-footer">
                                <div class="btn btn-link float-left" @click="handleAddLinks">添加链接</div>
                                <button class="btn btn-primary" :disabled="loading" @click="submit">全部保存</button>
                            </div>
                        </form>
                    </div>
                </div>
            `,
                data() {
                    return {
                        post_id: <?php the_ID();?>,
                        loading: false,
                        links: [],
                        tableColumn: [
                            {
                                name: '',
                                prop: 'drag-handle',
                                slot: true,
                                bind: {
                                    style: { width: '50px', minWidth: '50px' }
                                }
                            },
                            // {
                            //     name: '图像',
                            //     prop: 'image',
                            //     bind: {
                            //         style: { minWidth: '120px' }
                            //     }
                            // },
                            {
                                name: '名称',
                                prop: 'name',
                                bind: {
                                    style: { minWidth: '200px' }
                                }
                            },
                            {
                                name: '地址',
                                prop: 'url',
                                bind: {
                                    style: { minWidth: '240px' }
                                }
                            },
                            {
                                name: '描述',
                                prop: 'description',
                                bind: {
                                    style: { width: '100%', minWidth: '240px' }
                                }
                            },
                            {
                                name: '操作',
                                prop: 'operate',
                                slot: true,
                                bind: {
                                    style: { minWidth: '120px' }
                                }
                            },
                        ],
                    };
                },
                created() {
                    this.getLinks();
                },
                mounted() {
                    const $table = this.$refs.DragSort;
                    new Sortable($table, {
                        draggable: ".drag",
                        handle: ".drag-handle",
                        onUpdate: ({ oldIndex, newIndex }) => {
                            const $new = $table.children[newIndex];
                            const $old = $table.children[oldIndex];
                            $table.removeChild($new);
                            if ( newIndex > oldIndex ) {
                                $table.insertBefore($new, $old);
                            } else {
                                $table.insertBefore($new, $old.nextSibling);
                            }
                            const item = this.links.splice(oldIndex, 1);
                            this.links.splice(newIndex, 0, item[0]);
                        },
                    });
                },
                methods: {
                    getLinks() {
                        this.loading = true;
                        $h.ajax({ query: { action: 'get_post_meta', post_id: this.post_id, key: 'links' } })
                          .then(({ data }) => {
                              this.links = JSON.parse(data);
                          })
                          .finally(() => {
                              this.loading = false;
                          })
                    },
                    submit(e) {
                        if ( this.links.some(item => (!item.name || !item.url)) ) return;
                        this.links = this.links.map(item => {
                            delete item.edit;
                            return item;
                        });
                        this.loading = true;
                        $h.ajax({
                            query: { action: 'submit_post_meta', 'post_id': this.post_id, 'key': 'links' },
                            data: { content: JSON.stringify(this.links) },
                            method: 'POST',
                        })
                          .then((html) => {
                              this.reRender(html);
                              this.$toast({ type: 'success', message: '保存成功！' });
                              this.hide();
                          })
                          .finally(() => {
                              this.loading = false;
                          });
                        e.preventDefault();
                    },
                    reRender(html) {
                        document.querySelector("#Links").innerHTML = html;
                    },
                    handleAddLinks() {
                        this.links.push({ edit: true });
                        this.$nextTick(() => {
                            const el = this.$refs.body;
                            el.scrollTop = el.scrollHeight;
                        });
                    },
                    handleEditLink(index) {
                        this.$set(this.links, index, { ...this.links[index], edit: !this.links[index].edit });
                    },
                    handleRemoveLink(index) {
                        this.links.splice(index, 1);
                    },
                    hide() {
                        this.$el.remove();
                    },
                },
            });

            const vm = new Dialog({ el: document.createElement('div') });
            document.querySelector('#main').appendChild(vm.$el);
        };
    </script>

<?php endif;
if ( comments_open() || get_comments_number() ) :
    comments_template();
endif;
get_footer();
?>