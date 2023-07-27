import * as DD from "@radix-ui/react-dropdown-menu";
import { ChevronRightIcon } from "@radix-ui/react-icons";
import { ReactNode } from "react";
import styles from "./DropDownMenu.module.css";

interface MenuItem {
    label: string;
    onSelect?: () => void;
    subItems?: MenuItem[];
}

type DropDownMenuProps = {
    children: ReactNode;
    menuItems: MenuItem[];
}

const DropDownMenu = ({children, menuItems}: DropDownMenuProps) => {
    return (
        <DD.Root>
            <DD.Trigger asChild>
                {children}
            </DD.Trigger>
            <DD.Portal>
                <DD.Content className={styles.content}>
                    {menuItems.map((item, index) => (
                        <DD.Sub key={index}>
                            {item.onSelect && (
                                <DD.Item
                                    className={styles.menuitem}
                                    onSelect={item.onSelect}
                                >
                                    {item.label}
                                </DD.Item>
                            )}
                            {item.subItems && (
                                <>
                                    <DD.SubTrigger className={styles.subtrigger}>
                                        {item.label} <ChevronRightIcon className={styles.rightslot} width={16} height={16}/>
                                    </DD.SubTrigger>
                                    <DD.Portal>
                                        <DD.SubContent
                                            className={styles.subcontent}
                                            sideOffset={10}
                                            alignOffset={-4}
                                        >
                                            {item.subItems.map((subItem, subIndex) => (
                                                <DD.Item
                                                    key={subIndex}
                                                    className={styles.menuitem}
                                                    onSelect={subItem.onSelect}
                                                >
                                                    {subItem.label}
                                                </DD.Item>
                                            ))}
                                        </DD.SubContent>
                                    </DD.Portal>
                                </>
                            )}
                        </DD.Sub>
                    ))}

                    <DD.Arrow className={styles.arrow}/>
                </DD.Content>
            </DD.Portal>
        </DD.Root>
    );
}

export default DropDownMenu;

// <DropDownMenu.Root>
//     <DropDownMenu.Trigger asChild>
//         <Button className={styles.trigger}><DotsVerticalIcon width={16} height={16}/></Button>
//     </DropDownMenu.Trigger>
//     <DropDownMenu.Portal>
//         <DropDownMenu.Content className={styles.content}>
//             <DropDownMenu.Sub>
//                 <DropDownMenu.Item
//                     className={styles.menuitem}
//                     onSelect={handleOnInsertAbove}
//                 >
//                     Insert above
//                 </DropDownMenu.Item>
//                 <DropDownMenu.Item
//                     className={styles.menuitem}
//                     onSelect={handleOnInsertBelow}
//                 >
//                     Insert below
//                 </DropDownMenu.Item>
//                 <DropDownMenu.SubTrigger className={styles.subtrigger}>
//                     Delete <ChevronRightIcon className={styles.rightslot} width={16} height={16}/>
//                 </DropDownMenu.SubTrigger>
//                 <DropDownMenu.Portal>
//                     <DropDownMenu.SubContent
//                         className={styles.subcontent}
//                         sideOffset={10}
//                         alignOffset={-4}
//                     >
//                         <DropDownMenu.Item
//                             className={styles.menuitem}
//                             onSelect={handleOnDelete}
//                         >
//                             Are you sure?
//                         </DropDownMenu.Item>
//                     </DropDownMenu.SubContent>
//                 </DropDownMenu.Portal>
//             </DropDownMenu.Sub>
//         </DropDownMenu.Content>
//     </DropDownMenu.Portal>
// </DropDownMenu.Root>
