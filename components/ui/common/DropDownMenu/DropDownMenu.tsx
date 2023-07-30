import * as DD from "@radix-ui/react-dropdown-menu";
import { ChevronRightIcon } from "@radix-ui/react-icons";
import { ReactNode } from "react";
import styles from "./DropDownMenu.module.css";

export type MenuItem = {
    asChild?: boolean;
    label: string | ReactNode;
    onSelect?: () => void;
    subItems?: MenuItem[];
}

type DropDownMenuProps = {
    children?: ReactNode;
    menuItems: MenuItem[];
}

const DropDownMenu = ({children, menuItems}: DropDownMenuProps) => {
    return (
        <DD.Root>
            {children && (
                <DD.Trigger asChild>
                    {children}
                </DD.Trigger>
            )}
            <DD.Portal>
                <DD.Content className={styles.content}>
                    {menuItems.map((item, index) => (
                        <DD.Sub key={index}>
                            {item.subItems ? (
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
                            ) : (
                                <DD.Item
                                    className={styles.menuitem}
                                    onSelect={item.onSelect}
                                    asChild={item.asChild}
                                >
                                    {item.label}
                                </DD.Item>
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