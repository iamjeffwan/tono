# 设计体系护栏文档

## 目录

- `product/`：产品定位、流程和 MVP 定义；
- `research/`：官方资料核对和实现研究。shadcn 外观与默认盒子见 `research/shadcn-style-tokens.md`；
- `reference/`：上游工具和规则开发参考资料。Tailwind、shadcn 与全局样式的关系见 `reference/tailwind-shadcn-css.md`。色板、阶梯如何进入全局样式见 `reference/design-tokens-entry.md`；
- `phases/`：按开发阶段整理的方案、决策和验收标准。

## 当前产品基线

MVP 以 `docs/product/mvp-product-flow.md` 为准。

核心闭环是：

```text
基础令牌 → 项目语义 → 主题和规则包 → 真实项目检查 → 偏移报告
```
