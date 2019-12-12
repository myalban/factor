import { setting } from "@factor/api/settings"
import { addFilter } from "@factor/api/hooks"
import { addPageTemplate } from "@factor/templates"
import { addPostType } from "@factor/api/post-types"
import { addContentRoutes } from "@factor/api"
import { Component } from "vue"

const portfolioBaseRoute = setting("portfolio.postRoute")

export const setup = (): void => {
  addFilter({
    key: "ultraFont",
    hook: "factor_head",
    callback: (_: string[]) => {
      return [..._, setting("headTags.font")]
    },
    priority: 200
  })

  addPostType({
    postType: "portfolio",
    baseRoute: portfolioBaseRoute,
    icon: require("./img/portfolio.svg"),
    model: "portfolioPost",
    nameIndex: "Portfolio",
    nameSingle: "Portfolio Post",
    namePlural: "Portfolio"
  })

  addPostType({
    postType: "news",
    baseRoute: portfolioBaseRoute,
    icon: require("./img/news.svg"),
    model: "newsPost",
    nameIndex: "News",
    nameSingle: "News Post",
    namePlural: "News"
  })

  addPageTemplate({
    _id: "default",
    component: () => import("./page-template-default.vue")
  })

  addContentRoutes({
    key: "ultraRoutes",
    routes: [
      {
        path: "/",
        component: (): Promise<Component> => import("./page-home.vue")
      },
      {
        path: setting("portfolio.indexRoute"),
        component: setting("portfolio.components.portfolioWrap"),
        children: [
          {
            path: "/#portfolio",
            component: setting("portfolio.components.portfolioIndex")
          },
          {
            path: `${setting("portfolio.postRoute")}/:permalink`,
            component: setting("portfolio.components.portfolioSingle")
          }
        ]
      },
      {
        path: setting("news.indexRoute"),
        component: setting("news.components.newsWrap"),
        children: [
          {
            path: "/#news",
            component: setting("news.components.newsIndex")
          },
          {
            path: `${setting("news.postRoute")}/:permalink`,
            component: setting("news.components.newsSingle")
          }
        ]
      }
    ]
  })
}

setup()