import React from 'react'
import {connect} from 'react-redux'
import {
    changePage,
    pushAndrefetch,
    setPageFilter,
    toggleEntryEditStatus,
    TWEAK_OOPERATIONS_ENUM as TweakENUM,
    tweakEntry
} from './action'

import './index.scss'
import './index.mobile.scss'
import {HotKeys} from 'react-hotkeys';
import {Button, Checkbox, Col, Icon, List, Pagination, Row} from 'antd';
import SingleEntry from './SingleEntry/index'
import {duplicateMsgid, editNext, pushEntry} from './shortcutAction'

import FocusLock from 'react-focus-lock';

const IconText = ({type, text, onClick, disable}) => (
    <span onClick={onClick}>
        <Button disabled={disable} icon={type}>{text}</Button>
    </span>
);
const extraIcon = {
    ok: <span className="extra-icon-container"><Icon type={"check-circle"}
                                                     style={{color: "#52c41a", fontSize: "32px"}}/></span>,
    error: <span className="extra-icon-container"><Icon type={"close-circle"}
                                                        style={{color: "#a8071a", fontSize: "32px"}}/></span>,
    warning: <span className="extra-icon-container"><Icon type={"exclamation-circle"}
                                                          style={{color: "#fadb14", fontSize: "32px"}}/></span>,
    loading: <span className="extra-icon-container"><Icon type={"loading"} spin
                                                          style={{color: "#1890ff", fontSize: "32px"}}/></span>,
    untranslated: <span className="extra-icon-container"><Icon type={"question-circle"}
                                                               style={{color: "#1890ff", fontSize: "32px"}}/></span>,

}

class listEntries extends React.Component {
    constructor(props) {
        super(props)
        this.KeyHandler = {
            'editNext': (e) => this.props.dispatch(editNext()),
            'duplicateMsgid': (e) => this.props.dispatch(duplicateMsgid()),
            'pushEntry': (e) => this.props.dispatch(pushEntry()),
            'pushEntry2': (e) => this.props.dispatch(pushEntry()),

        };
        this.map = {
            'editNext': 'alt+j',
            'pushEntry': 'enter',
            'pushEntry2': 'alt+p',
            'duplicateMsgid': 'alt+c'
        };
    }

    componentDidMount() {
        this.props.dispatch(changePage(this.props.docName, 1, this.props.filter));
    }

    selectExtraIcon(id) {
        let v = this.props.listData.find(e => e.id === id);
        let Node = extraIcon.ok;
        if (!v.Translated)
            Node = extraIcon.untranslated;
        if (v.changed === true)
            Node = extraIcon.warning;
        if (v.loading === true)
            Node = extraIcon.loading;
        return Node;
    }

    selectAction(id) {
        let v = this.props.listData.find(e => e.id === id);
        let list = [];

        if (!v.editing)
            list.push(<IconText type="edit" text={v.Translated ? "修改" : "翻译"}
                                onClick={() => this.props.dispatch(toggleEntryEditStatus(id))}/>);

        else {
            list.push(<IconText type="edit" text={"结束"}
                                onClick={() => this.props.dispatch(toggleEntryEditStatus(id))}/>);
            list.push(<IconText disable={v.Msgstr.length === 0} type="upload" text="提交" onClick={
                () => {
                    this.props.dispatch(pushAndrefetch(this.props.docName, id, v));
                    this.props.dispatch(editNext())
                }
            }/>);
            list.push(<IconText  type="copy" text="" onClick={
                () => {
                    this.props.dispatch(duplicateMsgid())
                }
            }/>);
        }
        return list
    }

    render() {
        let data = this.props.listData
        if (data.length > 0) {
            let last = data[data.length - 1]
            if (last.needChangePage !== undefined && last.needChangePage === true) {
                this.props.dispatch(tweakEntry({}, TweakENUM.clear));// must clear first, otherwise when the next page is loading, action below will be invoke infinity times!
                this.props.dispatch(changePage(this.props.docName, this.props.pageMeta.currentPage + 1, this.props.filter));
            }
        }
        data.forEach((e) => {
            if (e.needToPush) {
                this.props.dispatch(pushAndrefetch(this.props.docName, e.id, e));
                this.props.dispatch(editNext())
            }
        })

        return (
            <FocusLock>
                <HotKeys handlers={this.KeyHandler} keyMap={this.map}>
                    <Row className="control-panel" type={"flex"} justify="space-between" align-items="center"
                         align-content='space-around'>

                        <Col
                            xs={{span: 24,}}
                            md={{span: 12}}
                            lg={{span: 6}}

                        >
                            <div className="control-panel-item">
                                <Checkbox
                                    checked={this.props.filter.untranslated}
                                    onChange={(e) => {
                                        console.log(e.target.checked);
                                        this.props.dispatch(setPageFilter({untranslated: e.target.checked}))
                                        this.props.dispatch(changePage(this.props.docName, 1, {
                                            ...this.props.filter,
                                            untranslated: e.target.checked
                                        }));
                                    }}>
                                    仅显示未翻译的条目
                                </Checkbox>
                            </div>
                        </Col>
                        <Col
                            xs={{span: 24,}}
                            md={{span: 12}}
                            lg={{span: 6}}
                        >
                        </Col>
                        <Col
                            xs={{span: 24,}}
                            lg={{span: 12}}
                        >
                            <div className="control-panel-item">

                                <Pagination
                                    size="small"
                                    onChange={(page) => {
                                        this.props.dispatch(changePage(this.props.docName, page, this.props.filter));
                                    }}
                                    total={this.props.pageMeta.count}
                                    pageSize={5}
                                    position="top"
                                    showQuickJumper={true}
                                    showTotal={(total, range) => `共有 ${total} 条`}
                                    current={this.props.pageMeta.currentPage}
                                />
                            </div>
                        </Col>
                    </Row>
                    <Row className={"entries-list"}>
                        <List
                            itemLayout="vertical"
                            size="large"
                            loading={this.props.pageMeta.loading}
                            dataSource={this.props.listData}
                            renderItem={item => (
                                <List.Item
                                    key={item.id}
                                    actions={this.selectAction(item.id)}
                                    extra={this.selectExtraIcon(item.id)}
                                >
                                    <SingleEntry
                                        Entry={{
                                            Msgid: item.Msgid,
                                            Msgstr: item.Msgstr
                                        }}
                                        onChange={(ch) => this.props.dispatch(tweakEntry({
                                            id: item.id,
                                            Msgid: item.Msgid,
                                            Msgstr: ch.Msgstr.value,
                                            fieldValidate: ch.error === undefined,
                                        }, TweakENUM.update))

                                        }
                                        disableEdit={!item.editing}
                                        fieldError={!item.fieldValidate}
                                        Translated={item.Translated}
                                    />
                                </List.Item>
                            )}
                        >
                        </List>
                    </Row>
                </HotKeys>
            </FocusLock>
        )
    }
}

function mapStateToProps(state) {
    return {
        listData: state.ListEntries.data,
        pageMeta: state.ListEntries.pageMeta,
        filter: {
            untranslated: state.ListEntries.pageMeta.untranslated,
        }
    }
}

const ListEntries = connect(mapStateToProps)(listEntries);

export default ListEntries;