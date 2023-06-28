export const Modal = ({
  show,
  onHide,
  proceedFunction,
  children,
  title = "",
  continueText = "",
  closeText = "",
  titleClassName = "",
  showHeader = true,
  bgColor = "bg-[#D9D9D9]",
}: {
  show: boolean;
  onHide: Function;
  children: any;
  proceedFunction?: Function;
  continueText?: string;
  title?: string;
  closeText?: string;
  titleClassName?: string;
  showHeader?: boolean;
  bgColor?: string;
}) => (
  <div
    className={`flex items-center justify-center bg-black bg-opacity-40 fixed z-[300] top-0 left-0 ${
      show ? "" : "hidden"
    } w-full h-full outline-none overflow-x-hidden overflow-y-auto z-50`}
    id="modalBackground"
    onClick={(e) => {
      e.stopPropagation();
      const target = e.target as HTMLDivElement;
      if (target.id === "modalBackground") onHide();
    }}
  >
    <div className="relative w-auto pointer-events-none">
      <div
        className={`border-none shadow-lg relative flex flex-col w-full pointer-events-auto ${bgColor} bg-clip-padding outline-none text-current`}
      >
        {showHeader && (
          <div
            className={`flex flex-shrink-0 items-center justify-between p-4 ${titleClassName}`}
          >
            <h5 className="text-xl font-medium leading-normal text-gray-800">
              {title}
            </h5>
            <button
              type="button"
              className={`btn-close box-content w-4 h-4 p-1 ${
                bgColor === "bg-[#D9D9D9]" ? "text-black" : "text-white"
              } border-none opacity-50 focus:shadow-none focus:outline-none focus:opacity-100 hover:text-black hover:opacity-75 hover:no-underline`}
              aria-label="Close"
              onClick={() => onHide()}
            >
              X
            </button>
          </div>
        )}
        {typeof children === "string" ? (
          <div className="flex px-8 py-4">{children}</div>
        ) : (
          children
        )}
        {continueText !== "" && closeText !== "" && (
          <div className="flex flex-shrink-0 gap-2 flex-wrap items-center justify-center p-16 border-gray-200">
            {continueText !== "" && (
              <button
                type="button"
                className="px-6 py-2.5 font-andika text-xl text-black border border-black rounded-full"
                onClick={() => proceedFunction?.()}
              >
                {continueText}
              </button>
            )}
            {closeText !== "" && (
              <button
                type="button"
                className="px-6 py-2.5 font-andika text-xl bg-black text-white rounded-full"
                onClick={() => onHide()}
              >
                {closeText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
);
