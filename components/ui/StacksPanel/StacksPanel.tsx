import Card from "@/components/ui/common/Card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./StacksPanel.module.css";

const StacksPanel = ({stacks}) => {
    const router = useRouter();

    return (
        <div className={styles.panel}>
            <h2 className={styles.header}>Recent stacks</h2>
            <div className={styles.stacks}>
                {stacks && stacks.length > 0 &&
                    stacks.map((stacks) => (
                        <Link key={stacks.id} href={`/stacks/${stacks.id}`}>
                            <Card title={stacks.name}
                                  onClick={() => {
                                      router.push(`/stacks/${stacks.id}`)
                                  }}
                            >{stacks.description}</Card>
                        </Link>)
                    )
                }
            </div>
        </div>
    );
}

export default StacksPanel;