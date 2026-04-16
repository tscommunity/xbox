export namespace DraggableApp {
  export const ROOT_ELEMENT_ID = "xbox-draggable-app";

  export const STORAGE_KEY = "XBOX_DRAGGABLE_APP";

  export enum Events {
    /**
     * 打开拖拽应用。
     */
    OPEN_DRAGGABLE_APP = "XBOX_DRAGGABLE_APP_EVENT_OPEN",

    /**
     * 隐藏拖拽应用。
     */
    HIDE_DRAGGABLE_APP = "XBOX_DRAGGABLE_APP_EVENT_HIDE",

    /**
     * 恢复拖拽应用。
     */
    RESUME_DRAGGABLE_APP = "XBOX_DRAGGABLE_APP_EVENT_RESUME",

    /**
     * 关闭拖拽应用。
     */
    CLOSE_DRAGGABLE_APP = "XBOX_DRAGGABLE_APP_EVENT_CLOSE",
  }
}
